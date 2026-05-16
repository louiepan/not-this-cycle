'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadReport, loadTranscript, updateRecommendationStatus } from '@/eval/storage';
import { downloadTranscript, renderReportMarkdown } from '@/eval/report';
import type { EvaluationReport, FindingCategory, Severity, Transcript } from '@/eval/types';

interface EvaluationPanelProps {
  sessionId: string | null;
}

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

export function EvaluationPanel({ sessionId }: EvaluationPanelProps) {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setTranscript(loadTranscript(sessionId));
    setReport(loadReport(sessionId));
  }, [sessionId]);

  const sortedRecs = useMemo(() => {
    if (!report) return [];
    return [...report.recommendations].sort((a, b) => {
      const sevDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return b.confidence - a.confidence;
    });
  }, [report]);

  if (!transcript || !report) {
    return null;
  }

  const handleStatusUpdate = (recId: string, status: 'approved' | 'rejected') => {
    if (!sessionId) return;
    const updated = updateRecommendationStatus(sessionId, recId, status);
    if (updated) setReport(updated);
  };

  const handleDownload = () => {
    if (transcript && report) downloadTranscript(transcript, report);
  };

  const handleCopyMarkdown = async () => {
    if (!transcript || !report) return;
    const markdown = renderReportMarkdown(report, transcript);
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      // Clipboard write can fail in some browsers; user can still download.
    }
  };

  return (
    <div
      className="mt-5 overflow-hidden rounded-xl border border-paper-border-subtle bg-paper-elevated"
      style={{ boxShadow: 'var(--shadow-paper-sm)' }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-paper-panel"
      >
        <div>
          <div className="text-[14px] font-semibold text-paper-text-primary">
            Session evaluation
          </div>
          <div className="mt-0.5 text-[12px] text-paper-text-tertiary">
            {report.summary.totalFindings} findings · {report.summary.highSeverity} high ·{' '}
            {report.summary.mediumSeverity} medium · {report.summary.lowSeverity} low
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="cursor-pointer rounded-md border border-paper-border bg-paper-panel px-3 py-1.5 text-[12px] font-medium text-paper-text-secondary transition-colors hover:bg-paper-elevated"
          >
            Download JSON
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyMarkdown();
            }}
            className="cursor-pointer rounded-md border border-paper-border bg-paper-panel px-3 py-1.5 text-[12px] font-medium text-paper-text-secondary transition-colors hover:bg-paper-elevated"
          >
            Copy markdown
          </button>
          <span className="text-[16px] text-paper-text-tertiary">{expanded ? '▾' : '▸'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-paper-border-subtle bg-paper-panel px-5 py-4">
          {sortedRecs.length === 0 ? (
            <p className="text-[13px] text-paper-text-tertiary">
              No findings. This playthrough looked clean against the deterministic checks.
            </p>
          ) : (
            <div className="stack-md">
              <CategoryCounts categoryCounts={report.summary.categoryCounts} />
              <div className="space-y-3">
                {sortedRecs.map((rec) => {
                  const finding = report.findings.find((f) => f.id === rec.findingId);
                  return (
                    <div
                      key={rec.id}
                      className="rounded-lg border border-paper-border-subtle bg-paper-elevated p-3"
                    >
                      <div className="mb-1.5 flex items-baseline gap-2">
                        <SeverityBadge severity={rec.severity} />
                        <span className="text-[12px] font-semibold uppercase tracking-wider text-paper-text-tertiary">
                          {rec.category}
                        </span>
                        <span className="ml-auto text-[11px] text-paper-text-tertiary">
                          {(rec.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      {finding && (
                        <div className="mb-2 text-[13px] font-semibold text-paper-text-primary">
                          {finding.title}
                        </div>
                      )}
                      {finding && (
                        <div className="mb-2 text-[12.5px] leading-relaxed text-paper-text-secondary">
                          {finding.description}
                        </div>
                      )}
                      {finding?.evidence.snippet && (
                        <div className="mb-2 rounded border-l-2 border-paper-border bg-paper-panel px-2 py-1 text-[12px] italic text-paper-text-tertiary">
                          {finding.evidence.snippet}
                        </div>
                      )}
                      <div className="mb-2 text-[12.5px] leading-relaxed text-paper-text-secondary">
                        <span className="font-semibold">Suggested change: </span>
                        {rec.suggestedChange}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(rec.id, 'approved')}
                          disabled={rec.status === 'approved'}
                          className={`cursor-pointer rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                            rec.status === 'approved'
                              ? 'bg-accent text-white'
                              : 'border border-paper-border bg-paper-panel text-paper-text-secondary hover:bg-paper-elevated'
                          }`}
                        >
                          {rec.status === 'approved' ? 'Approved' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(rec.id, 'rejected')}
                          disabled={rec.status === 'rejected'}
                          className={`cursor-pointer rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                            rec.status === 'rejected'
                              ? 'bg-paper-border-strong text-paper-text-secondary'
                              : 'border border-paper-border bg-paper-panel text-paper-text-secondary hover:bg-paper-elevated'
                          }`}
                        >
                          {rec.status === 'rejected' ? 'Rejected' : 'Reject'}
                        </button>
                        {rec.status === 'pending_review' && (
                          <span className="text-[11px] text-paper-text-tertiary">Pending review</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryCounts({
  categoryCounts,
}: {
  categoryCounts: Record<FindingCategory, number>;
}) {
  const entries = Object.entries(categoryCounts).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 text-[11.5px] text-paper-text-tertiary">
      {entries.map(([cat, count]) => (
        <span key={cat} className="rounded-full border border-paper-border bg-paper-elevated px-2 py-0.5">
          {cat}: {count}
        </span>
      ))}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const styles: Record<Severity, string> = {
    high: 'bg-accent text-white',
    medium: 'bg-paper-border-strong text-paper-text-primary',
    low: 'bg-paper-panel text-paper-text-tertiary border border-paper-border',
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}
