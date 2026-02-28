export type AnalyticsEventType =
  | 'session_start'
  | 'session_end'
  | 'decision_made'
  | 'decision_escalated'
  | 'decision_auto_resolved'
  | 'channel_switch'
  | 'game_complete'
  | 'difficulty_selected'
  | 'low_confidence_nudge';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  sessionId: string;
  payload: Record<string, unknown>;
}
