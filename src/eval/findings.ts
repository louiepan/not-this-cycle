import type { DeliveredMessage, Stakeholder } from '@/engine/types';
import type { Finding, Transcript } from './types';

// Phrases the prompts explicitly ban. Matching is case-insensitive substring.
const ANTI_PATTERN_PHRASES: Array<{ phrase: string; label: string }> = [
  { phrase: "i'd be happy to", label: "I'd be happy to" },
  { phrase: 'i would be happy to', label: 'I would be happy to' },
  { phrase: 'certainly!', label: 'Certainly!' },
  { phrase: 'great question', label: 'Great question' },
  { phrase: 'absolutely!', label: 'Absolutely!' },
  { phrase: 'of course!', label: 'Of course!' },
  { phrase: 'at the end of the day', label: 'At the end of the day' },
  { phrase: 'the key is', label: 'The key is' },
  { phrase: 'happy to help', label: 'Happy to help' },
];

// Em-dash detection. Only flag in AI-generated content (eventId starts with
// 'narrative-runtime' or similar). Authored content can use em-dashes freely.
function isLikelyAiGenerated(msg: DeliveredMessage): boolean {
  return msg.eventId === 'narrative-runtime' || msg.id.startsWith('pushback-') === false
    ? msg.eventId === 'narrative-runtime'
    : false;
}

let findingCounter = 0;
function nextFindingId(): string {
  findingCounter += 1;
  return `find-${Date.now().toString(36)}-${findingCounter}`;
}

// ============================================================
// Voice anti-pattern scan
// ============================================================

function findAntiPatternViolations(transcript: Transcript): Finding[] {
  const findings: Finding[] = [];
  for (const msg of transcript.messages) {
    if (msg.isPlayerMessage || msg.from === 'player') continue;
    if (!isLikelyAiGenerated(msg)) continue;
    const lower = msg.content.toLowerCase();
    for (const { phrase, label } of ANTI_PATTERN_PHRASES) {
      if (lower.includes(phrase)) {
        findings.push({
          id: nextFindingId(),
          category: 'voice',
          severity: 'high',
          title: `Banned phrase "${label}" in generated message`,
          description: `Stakeholder ${msg.from} used "${label}" in an AI-generated line. The prompt anti-pattern list bans this; it reads as assistant-LLM voice rather than in-character.`,
          evidence: {
            messageIds: [msg.id],
            stakeholderId: msg.from,
            snippet: msg.content,
          },
        });
      }
    }
    if (msg.content.includes('—')) {
      findings.push({
        id: nextFindingId(),
        category: 'voice',
        severity: 'medium',
        title: 'Em-dash in generated message',
        description: `Stakeholder ${msg.from} used an em-dash. The prompt bans em-dashes in generated dialogue (use commas, periods, or parentheses).`,
        evidence: {
          messageIds: [msg.id],
          stakeholderId: msg.from,
          snippet: msg.content,
        },
      });
    }
  }
  return findings;
}

// ============================================================
// Engagement metrics
// ============================================================

function findEngagementIssues(transcript: Transcript): Finding[] {
  const findings: Finding[] = [];
  const totalDecisions = transcript.decisions.length;
  if (totalDecisions === 0) return findings;

  const pureTimeouts = transcript.decisions.filter(
    (d) => d.outcome.matchSource === 'timeout'
  );
  const fallbacks = transcript.decisions.filter(
    (d) => d.outcome.matchSource === 'low_confidence_fallback'
  );
  const totalPushBacks = transcript.decisions.reduce(
    (sum, d) => sum + d.outcome.pushBackStrikes,
    0
  );
  const totalDefers = transcript.decisions.filter((d) => d.outcome.wasDefer).length;
  const playerReplies = transcript.decisions
    .map((d) => d.outcome.playerText)
    .filter((t): t is string => !!t);
  const avgLen =
    playerReplies.length > 0
      ? playerReplies.reduce((s, t) => s + t.split(/\s+/).length, 0) / playerReplies.length
      : 0;

  // Pure timeout = player never typed in the channel. That's the engagement signal.
  const pureTimeoutRate = pureTimeouts.length / totalDecisions;
  if (pureTimeoutRate > 0.3) {
    findings.push({
      id: nextFindingId(),
      category: 'engagement',
      severity: 'high',
      title: `${Math.round(pureTimeoutRate * 100)}% of decisions timed out with no player reply`,
      description: `Player never typed in the decision channel for ${pureTimeouts.length} of ${totalDecisions} decisions. Either the timer is too tight or the player didn't see the ask.`,
      evidence: {
        metric: {
          name: 'pure_timeout_rate',
          value: pureTimeoutRate,
          threshold: 0.3,
        },
        decisionIds: pureTimeouts.map((d) => d.decisionId),
      },
    });
  }

  // Fallback resolution = player typed but never landed a confident match.
  // That is a matching/affordance issue, not engagement. Reported separately.
  const fallbackRate = fallbacks.length / totalDecisions;
  if (fallbackRate > 0.3) {
    findings.push({
      id: nextFindingId(),
      category: 'matching',
      severity: 'high',
      title: `${Math.round(fallbackRate * 100)}% of decisions resolved by low-confidence inference`,
      description: `Player replied to ${fallbacks.length} of ${totalDecisions} decisions but no reply matched a choice with enough confidence. The engine inferred a best-fit at half weight, but this is a matching problem: the classifier, the decision phrasing, or the expected response shape is off.`,
      evidence: {
        metric: {
          name: 'low_confidence_fallback_rate',
          value: fallbackRate,
          threshold: 0.3,
        },
        decisionIds: fallbacks.map((d) => d.decisionId),
      },
    });
  }

  if (totalPushBacks >= 3) {
    findings.push({
      id: nextFindingId(),
      category: 'engagement',
      severity: 'medium',
      title: `${totalPushBacks} low-confidence push-backs across ${totalDecisions} decisions`,
      description: `Player produced enough vague replies to trigger multiple stakeholder push-backs. May signal that decision phrasing is hard to respond to in free-text, or that the player wanted a button affordance.`,
      evidence: {
        metric: { name: 'push_back_count', value: totalPushBacks, threshold: 3 },
      },
    });
  }

  if (avgLen > 0 && avgLen < 4) {
    findings.push({
      id: nextFindingId(),
      category: 'engagement',
      severity: 'medium',
      title: `Player replies averaged ${avgLen.toFixed(1)} words`,
      description: `Short replies (<4 words avg) suggest the player either was disengaged or couldn't figure out what to type. Consider whether the decisions invited longer responses.`,
      evidence: {
        metric: { name: 'avg_player_reply_words', value: Math.round(avgLen * 10) / 10 },
      },
    });
  }

  if (totalDefers > 0 && totalDefers / totalDecisions > 0.25) {
    findings.push({
      id: nextFindingId(),
      category: 'engagement',
      severity: 'low',
      title: `Player chose defer/hedge on ${totalDefers} of ${totalDecisions} decisions`,
      description: `High defer rate often indicates the player is unsure or wants to avoid committing. May reflect the satire (PMs defer in real life) or signal the decisions need clearer stakes.`,
      evidence: {
        metric: { name: 'defer_rate', value: totalDefers / totalDecisions },
      },
    });
  }

  return findings;
}

// ============================================================
// Pacing
// ============================================================

function findPacingIssues(transcript: Transcript): Finding[] {
  const findings: Finding[] = [];
  if (transcript.messages.length < 2) return findings;

  const sorted = [...transcript.messages].sort((a, b) => a.timestamp - b.timestamp);
  let longestGap = 0;
  let longestGapStart = 0;
  let longestGapEnd = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = sorted[i].timestamp - sorted[i - 1].timestamp;
    if (gap > longestGap) {
      longestGap = gap;
      longestGapStart = sorted[i - 1].timestamp;
      longestGapEnd = sorted[i].timestamp;
    }
  }

  // Long quiet stretches early in the game break the "overwhelming Slack"
  // feel. After 60s, some breathing room is realistic.
  if (longestGap > 25000 && longestGapStart < 60000) {
    findings.push({
      id: nextFindingId(),
      category: 'pacing',
      severity: 'medium',
      title: `${Math.round(longestGap / 1000)}s quiet stretch early in the game`,
      description: `Between ${Math.round(longestGapStart / 1000)}s and ${Math.round(longestGapEnd / 1000)}s nothing happened. Early-game dead air breaks the "Slack is hammering you" tone the satire depends on.`,
      evidence: {
        metric: { name: 'longest_quiet_gap_ms', value: longestGap, threshold: 25000 },
      },
    });
  }

  // Conversely, if there's never a quiet moment, the player can't think.
  if (longestGap < 4000 && sorted.length > 30) {
    findings.push({
      id: nextFindingId(),
      category: 'pacing',
      severity: 'low',
      title: 'No breathing room — never a gap longer than 4s',
      description: 'Messages are landing in a constant stream with no quiet moments. Players need brief lulls to gather context and decide.',
      evidence: {
        metric: { name: 'longest_quiet_gap_ms', value: longestGap, threshold: 4000 },
      },
    });
  }

  return findings;
}

// ============================================================
// Content coverage
// ============================================================

function findCoverageGaps(transcript: Transcript): Finding[] {
  const findings: Finding[] = [];
  const totalDecisions = transcript.decisions.length;

  // Channels the player never visited (had no outgoing messages in)
  const playerActiveChannels = new Set(
    transcript.messages
      .filter((m) => m.isPlayerMessage)
      .map((m) => m.channel)
  );
  const allChannels = new Set(transcript.messages.map((m) => m.channel));
  const untouchedChannels = Array.from(allChannels).filter(
    (ch) => !playerActiveChannels.has(ch)
  );

  if (untouchedChannels.length > allChannels.size * 0.6) {
    findings.push({
      id: nextFindingId(),
      category: 'coverage',
      severity: 'low',
      title: `Player visited ${playerActiveChannels.size} of ${allChannels.size} channels`,
      description: 'Most channels never got a player message. Could be normal (noise channels are noise) or could signal the player didn\'t notice an important channel.',
      evidence: {
        metric: { name: 'channels_visited', value: playerActiveChannels.size },
      },
    });
  }

  if (totalDecisions < 3) {
    findings.push({
      id: nextFindingId(),
      category: 'coverage',
      severity: 'high',
      title: `Only ${totalDecisions} decisions presented`,
      description: 'A full 3-minute scenario should present more decisions than this. Either the game ended early, the player auto-resolved past the interesting ones, or scenario timing needs adjustment.',
      evidence: {
        metric: { name: 'decision_count', value: totalDecisions },
      },
    });
  }

  return findings;
}

// ============================================================
// Stakeholder voice-register length deviation (cheap sanity check)
// ============================================================

function findVoiceLengthDrift(
  transcript: Transcript,
  stakeholdersById: Map<string, Stakeholder>
): Finding[] {
  const findings: Finding[] = [];
  // Compute average authored-example length per stakeholder; flag delivered
  // AI messages that exceed it by >3x. Crude but catches the model going
  // long when the voice register implies terseness.
  for (const [id, stakeholder] of stakeholdersById) {
    if (stakeholder.personality.voiceExamples.length === 0) continue;
    const avgExampleLen =
      stakeholder.personality.voiceExamples.reduce(
        (sum, ex) => sum + ex.split(/\s+/).length,
        0
      ) / stakeholder.personality.voiceExamples.length;
    const aiMessages = transcript.messages.filter(
      (m) =>
        m.from === id &&
        !m.isPlayerMessage &&
        isLikelyAiGenerated(m)
    );
    for (const msg of aiMessages) {
      const words = msg.content.split(/\s+/).length;
      if (words > avgExampleLen * 3) {
        findings.push({
          id: nextFindingId(),
          category: 'voice',
          severity: 'medium',
          title: `${stakeholder.name} generated a ${words}-word reply (voice register avg: ${Math.round(avgExampleLen)})`,
          description: `Generated line is 3x longer than the stakeholder's voiceExamples. Voice register probably implies terseness; the model went verbose.`,
          evidence: {
            messageIds: [msg.id],
            stakeholderId: id,
            snippet: msg.content,
            metric: { name: 'word_count', value: words, threshold: avgExampleLen * 3 },
          },
        });
      }
    }
  }
  return findings;
}

// ============================================================
// Public entry point
// ============================================================

export function runFindings(transcript: Transcript): Finding[] {
  findingCounter = 0;
  const stakeholdersById = new Map<string, Stakeholder>();
  for (const s of transcript.stakeholders) stakeholdersById.set(s.id, s);

  return [
    ...findAntiPatternViolations(transcript),
    ...findVoiceLengthDrift(transcript, stakeholdersById),
    ...findEngagementIssues(transcript),
    ...findPacingIssues(transcript),
    ...findCoverageGaps(transcript),
  ];
}
