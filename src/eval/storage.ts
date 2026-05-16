import type { EvaluationReport, Recommendation, Transcript } from './types';

const TRANSCRIPT_PREFIX = 'ntc:transcripts:';
const REPORT_PREFIX = 'ntc:eval-reports:';
const INDEX_KEY = 'ntc:transcripts:index';

// localStorage is browser-only; guard all access so module imports cleanly
// during SSR / test runs.
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

interface TranscriptIndexEntry {
  sessionId: string;
  createdAt: string;
  playerName: string;
  difficulty: string;
  compositeScore: number;
  archetype: string;
}

export function saveTranscript(transcript: Transcript): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      `${TRANSCRIPT_PREFIX}${transcript.sessionId}`,
      JSON.stringify(transcript)
    );
    appendIndex({
      sessionId: transcript.sessionId,
      createdAt: transcript.createdAt,
      playerName: transcript.playerName,
      difficulty: transcript.difficulty,
      compositeScore: transcript.finalRating.compositeScore,
      archetype: transcript.finalRating.archetype,
    });
  } catch {
    // Quota exceeded or private mode; transcript download still works.
  }
}

export function loadTranscript(sessionId: string): Transcript | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(`${TRANSCRIPT_PREFIX}${sessionId}`);
    return raw ? (JSON.parse(raw) as Transcript) : null;
  } catch {
    return null;
  }
}

export function listTranscripts(): TranscriptIndexEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TranscriptIndexEntry[];
    // Most recent first.
    return parsed.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function deleteTranscript(sessionId: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(`${TRANSCRIPT_PREFIX}${sessionId}`);
    window.localStorage.removeItem(`${REPORT_PREFIX}${sessionId}`);
    const index = listTranscripts().filter((entry) => entry.sessionId !== sessionId);
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // ignore
  }
}

function appendIndex(entry: TranscriptIndexEntry): void {
  if (!isBrowser()) return;
  try {
    const existing = listTranscripts().filter((e) => e.sessionId !== entry.sessionId);
    existing.unshift(entry);
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

export function saveReport(report: EvaluationReport): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      `${REPORT_PREFIX}${report.sessionId}`,
      JSON.stringify(report)
    );
  } catch {
    // ignore
  }
}

export function loadReport(sessionId: string): EvaluationReport | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(`${REPORT_PREFIX}${sessionId}`);
    return raw ? (JSON.parse(raw) as EvaluationReport) : null;
  } catch {
    return null;
  }
}

// Update a single recommendation's status (approve/reject). Returns the
// updated report so callers can re-render.
export function updateRecommendationStatus(
  sessionId: string,
  recommendationId: string,
  status: Recommendation['status'],
  reason?: string
): EvaluationReport | null {
  const report = loadReport(sessionId);
  if (!report) return null;
  const updated: EvaluationReport = {
    ...report,
    recommendations: report.recommendations.map((rec) =>
      rec.id === recommendationId
        ? {
            ...rec,
            status,
            decidedAt: new Date().toISOString(),
            decisionReason: reason,
          }
        : rec
    ),
  };
  saveReport(updated);
  return updated;
}
