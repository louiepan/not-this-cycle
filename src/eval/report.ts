import { generateRecommendations } from './recommendations';
import { runFindings } from './findings';
import type {
  EvaluationReport,
  Finding,
  FindingCategory,
  Recommendation,
  Transcript,
} from './types';

export function buildEvaluationReport(transcript: Transcript): EvaluationReport {
  const findings = runFindings(transcript);
  const recommendations = generateRecommendations(findings, transcript);
  const summary = summarize(findings);
  return {
    sessionId: transcript.sessionId,
    generatedAt: new Date().toISOString(),
    findings,
    recommendations,
    summary,
  };
}

function summarize(findings: Finding[]): EvaluationReport['summary'] {
  const categoryCounts: Record<FindingCategory, number> = {
    voice: 0,
    matching: 0,
    engagement: 0,
    pacing: 0,
    coverage: 0,
  };
  let high = 0;
  let medium = 0;
  let low = 0;
  for (const f of findings) {
    categoryCounts[f.category] += 1;
    if (f.severity === 'high') high += 1;
    else if (f.severity === 'medium') medium += 1;
    else low += 1;
  }
  return {
    totalFindings: findings.length,
    highSeverity: high,
    mediumSeverity: medium,
    lowSeverity: low,
    categoryCounts,
  };
}

// Render a human-readable markdown view of the report. Used in the review
// screen's collapsible panel and downloadable alongside the transcript JSON.
export function renderReportMarkdown(
  report: EvaluationReport,
  transcript: Transcript
): string {
  const lines: string[] = [];

  lines.push(`# Session Evaluation — ${transcript.createdAt}`);
  lines.push('');
  lines.push(
    `**Player:** ${transcript.playerName}  |  **Difficulty:** ${transcript.difficulty}  |  **Composite:** ${transcript.finalRating.compositeScore.toFixed(1)} / 100 (${transcript.finalRating.calibrationBucket})  |  **Archetype:** ${transcript.finalRating.archetype}`
  );
  lines.push(
    `**Company:** ${transcript.world.companyName} (${transcript.world.teamName} team)  |  **Session:** \`${transcript.sessionId}\``
  );
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(
    `- Total findings: ${report.summary.totalFindings} (${report.summary.highSeverity} high, ${report.summary.mediumSeverity} medium, ${report.summary.lowSeverity} low)`
  );
  for (const [cat, count] of Object.entries(report.summary.categoryCounts)) {
    if (count > 0) lines.push(`- ${cat}: ${count}`);
  }
  lines.push('');

  if (report.findings.length === 0) {
    lines.push('No findings. This playthrough looked clean against the deterministic checks.');
    lines.push('');
    return lines.join('\n');
  }

  // Group findings by category for readability.
  const byCategory = new Map<FindingCategory, Finding[]>();
  for (const f of report.findings) {
    if (!byCategory.has(f.category)) byCategory.set(f.category, []);
    byCategory.get(f.category)!.push(f);
  }

  lines.push('## Findings');
  lines.push('');
  for (const [category, findings] of byCategory) {
    lines.push(`### ${categoryHeading(category)} (${findings.length})`);
    lines.push('');
    for (const finding of findings) {
      lines.push(`**[${finding.severity.toUpperCase()}] ${finding.title}**`);
      lines.push('');
      lines.push(finding.description);
      lines.push('');
      if (finding.evidence.snippet) {
        lines.push(`> ${finding.evidence.snippet.replace(/\n/g, '\n> ')}`);
        lines.push('');
      }
      if (finding.evidence.metric) {
        const m = finding.evidence.metric;
        const threshold = m.threshold !== undefined ? ` (threshold: ${m.threshold})` : '';
        lines.push(`*${m.name}: ${m.value}${threshold}*`);
        lines.push('');
      }
      if (finding.evidence.messageIds && finding.evidence.messageIds.length > 0) {
        lines.push(`*Message IDs: ${finding.evidence.messageIds.join(', ')}*`);
        lines.push('');
      }
    }
  }

  lines.push('## Recommendations');
  lines.push('');
  lines.push('Each item starts as pending. Check the box and add a short note when you decide.');
  lines.push('');
  const sortedRecs = [...report.recommendations].sort((a, b) => {
    const sev = { high: 0, medium: 1, low: 2 };
    if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
    return b.confidence - a.confidence;
  });
  for (const rec of sortedRecs) {
    const checkbox = rec.status === 'approved' ? '[x]' : rec.status === 'rejected' ? '[~]' : '[ ]';
    lines.push(
      `- ${checkbox} **${rec.severity.toUpperCase()} · ${rec.category}** (confidence ${(rec.confidence * 100).toFixed(0)}%)`
    );
    lines.push(`  - **Change:** ${rec.suggestedChange}`);
    lines.push(`  - **Why:** ${rec.rationale}`);
    if (rec.decidedAt) {
      lines.push(
        `  - **Status:** ${rec.status} at ${rec.decidedAt}${rec.decisionReason ? ` — ${rec.decisionReason}` : ''}`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

function categoryHeading(category: FindingCategory): string {
  switch (category) {
    case 'voice':
      return 'Voice';
    case 'matching':
      return 'Decision matching';
    case 'engagement':
      return 'Player engagement';
    case 'pacing':
      return 'Pacing';
    case 'coverage':
      return 'Content coverage';
    default:
      return category;
  }
}

// Convenience for the download button: bundle transcript + report into one
// file the user can stash anywhere.
export function buildDownloadPayload(
  transcript: Transcript,
  report: EvaluationReport
): { filename: string; content: string } {
  const date = transcript.createdAt.replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const filename = `ntc-session-${date}-${transcript.sessionId.slice(-6)}.json`;
  const payload = {
    transcript,
    report,
    markdown: renderReportMarkdown(report, transcript),
  };
  return { filename, content: JSON.stringify(payload, null, 2) };
}

export function downloadTranscript(transcript: Transcript, report: EvaluationReport): void {
  if (typeof window === 'undefined') return;
  const { filename, content } = buildDownloadPayload(transcript, report);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Used by the recommendation list re-renderer if a status changes.
export function buildReportFromTranscript(transcript: Transcript): EvaluationReport {
  return buildEvaluationReport(transcript);
}

// Used for the partial-status updates after approve/reject.
export function updateRecommendationsInPlace(
  report: EvaluationReport,
  updated: Recommendation[]
): EvaluationReport {
  return { ...report, recommendations: updated };
}
