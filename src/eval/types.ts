import type {
  DeliveredMessage,
  Difficulty,
  GameVariables,
  RatingResult,
  ScenarioWorld,
  Stakeholder,
} from '@/engine/types';

// A frozen capture of one playthrough. Persisted to localStorage on game
// completion; downloadable as JSON. The shape is intentionally flat-ish so
// the file is auditable by a human reading it directly.
export interface Transcript {
  schemaVersion: 1;
  sessionId: string;
  createdAt: string; // ISO timestamp
  durationMs: number;
  scenarioId: string;
  seed: number;
  difficulty: Difficulty;
  playerName: string;
  world: ScenarioWorld;
  stakeholders: Stakeholder[];
  messages: DeliveredMessage[];
  decisions: TranscriptDecision[];
  finalVariables: GameVariables;
  finalRating: RatingResult;
}

// One row per decision the player faced this session.
export interface TranscriptDecision {
  decisionId: string;
  eventId: string;
  channel: string;
  presentedAt: number;
  resolvedAt: number | null;
  choices: Array<{ id: string; label: string; tone: string }>;
  outcome: {
    matchedChoiceId: string | null; // null = auto-resolved (timeout)
    playerText: string | null;
    wasDefer: boolean;
    wasAutoResolved: boolean;
    pushBackStrikes: number; // how many low-confidence push-backs fired
  };
}

// A single observation from the deterministic check suite.
export type FindingCategory =
  | 'voice' // anti-pattern violations, voice register adherence
  | 'matching' // confidence histogram, push-back rate
  | 'engagement' // response times, defer rate, channel switches
  | 'pacing' // quiet stretches, concurrent activity
  | 'coverage'; // authored content fired vs. didn't

export type Severity = 'low' | 'medium' | 'high';

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  description: string;
  evidence: {
    messageIds?: string[];
    decisionIds?: string[];
    stakeholderId?: string;
    metric?: { name: string; value: number; threshold?: number };
    snippet?: string;
  };
}

// A finding turned into an actionable suggestion. Status is user-managed.
export type RecommendationStatus = 'pending_review' | 'approved' | 'rejected';

export interface Recommendation {
  id: string;
  findingId: string;
  category: FindingCategory;
  severity: Severity;
  suggestedChange: string;
  rationale: string;
  confidence: number; // 0..1
  status: RecommendationStatus;
  decidedAt?: string;
  decisionReason?: string;
}

export interface EvaluationReport {
  sessionId: string;
  generatedAt: string;
  findings: Finding[];
  recommendations: Recommendation[];
  summary: {
    totalFindings: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    categoryCounts: Record<FindingCategory, number>;
  };
}
