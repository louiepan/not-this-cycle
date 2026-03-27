export type AnalyticsEventType =
  | 'session_start'
  | 'session_end'
  | 'decision_made'
  | 'decision_escalated'
  | 'decision_auto_resolved'
  | 'channel_switch'
  | 'game_complete'
  | 'difficulty_selected'
  | 'low_confidence_nudge'
  | 'narrative_turn_applied'
  | 'narrative_turn_fallback'
  | 'narrative_review_applied';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  sessionId: string;
  payload: Record<string, unknown>;
}

export interface CostEvent {
  sessionId: string;
  taskType: string;
  providerId: string;
  modelId: string;
  snapshot: string;
  latencyMs: number;
  estimatedCostUsd: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  reasoningTokens: number;
  cacheHit: boolean;
  fallbackUsed: boolean;
  promptVersion: string;
  schemaVersion: string;
  recordedAt: number;
}

export interface RoutingEvalResult {
  configId: string;
  experienceScore: number;
  sessionCostUsd: number;
  p95LatencyMs: number;
  fallbackRate: number;
  parseFailureRate: number;
  routingScore: number;
  passedQualityFloor: boolean;
  rankedAt: number;
}
