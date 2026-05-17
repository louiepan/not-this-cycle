// ============================================================
// Core Game Engine Types
// ============================================================

export type VariableName =
  | 'execTrust'
  | 'communicationEffectiveness'
  | 'teamMorale'
  | 'productJudgment'
  | 'techDebt'
  | 'responsivenessDebt';

export type GamePhase = 'intro' | 'active' | 'review';

export type Difficulty = 'junior' | 'senior' | 'principal';

export type Tone = 'diplomatic' | 'direct' | 'deflecting' | 'committing';
export type PlayerReplySignal =
  | 'ownership'
  | 'collaboration'
  | 'risk'
  | 'deferral'
  | 'help_request'
  | 'boundary_setting'
  | 'transparency';

export type ConflictStyle = 'confront' | 'withdraw' | 'triangulate' | 'absorb';

export type EscalationPattern =
  | 'go-public'
  | 'go-silent'
  | 'go-around'
  | 'take-over';

export type Seniority = 'ic' | 'manager' | 'director' | 'vp' | 'c-suite';

export type MessageContextValue = 'noise' | 'ambient' | 'optional' | 'trap';

export type EventPriority = 'escalation' | 'decision' | 'ambient';

// ============================================================
// Difficulty
// ============================================================

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  timingScale: number;
  escalationTimeoutScale: number;
  ambientNoiseLevel: number;
  concurrentConversations: number;
  typingLeadTimeMs: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  junior: {
    id: 'junior',
    label: 'Junior PM',
    timingScale: 1.3,
    escalationTimeoutScale: 1.3,
    ambientNoiseLevel: 0.3,
    concurrentConversations: 2,
    typingLeadTimeMs: 2500,
  },
  senior: {
    id: 'senior',
    label: 'Senior PM',
    timingScale: 1.0,
    escalationTimeoutScale: 1.0,
    ambientNoiseLevel: 0.6,
    concurrentConversations: 3,
    typingLeadTimeMs: 1500,
  },
  principal: {
    id: 'principal',
    label: 'Principal PM',
    timingScale: 0.7,
    escalationTimeoutScale: 0.7,
    ambientNoiseLevel: 0.9,
    concurrentConversations: 4,
    typingLeadTimeMs: 800,
  },
};

// ============================================================
// Game State
// ============================================================

export interface GameVariables {
  execTrust: number;
  communicationEffectiveness: number;
  teamMorale: number;
  productJudgment: number;
  techDebt: number;
  responsivenessDebt: number;
}

export const INITIAL_VARIABLES: GameVariables = {
  execTrust: 50,
  communicationEffectiveness: 50,
  teamMorale: 60,
  productJudgment: 50,
  techDebt: 30,
  responsivenessDebt: 0,
};

export interface GameState {
  variables: GameVariables;
  clock: number;
  phase: GamePhase;
  deliveredEvents: string[];
  pendingDecisions: PendingDecision[];
  resolvedDecisions: ResolvedDecision[];
  messages: DeliveredMessage[];
  unreadCounts: Record<string, number>;
  mentionCounts: Record<string, number>;
  activeChannel: string;
}

export interface PlayerAttempt {
  text: string;
  timestamp: number;
  confidence: number;
  bestChoiceId: string;
}

export interface PendingDecision {
  decisionId: string;
  eventId: string;
  channel: string;
  presentedAt: number;
  timeout: number;
  choices: Choice[];
  escalationStage: number;
  // Stakeholder who delivered the message that presents this decision.
  // Used so push-backs come from the asker, not whoever last spoke in the channel.
  askerId?: string;
  // Vague player replies recorded while the decision is still open. Drives the
  // graceful-degradation auto-resolve and feeds the post-game "what you said" view.
  attempts?: PlayerAttempt[];
  pushBackStrikes?: number;
}

export type DecisionMatchSource = 'matched' | 'low_confidence_fallback' | 'timeout';

export interface ResolvedDecision {
  decisionId: string;
  choiceId: string | null; // null = pure timeout with no inference
  resolvedAt: number;
  effects: StateEffect[];
  tags: string[];
  wasDefer: boolean;
  contradicts: string | null;
  playerText?: string;
  matchedTone?: Tone | null;
  replySignals?: PlayerReplySignal[];
  addressedStakeholderIds?: string[];
  // Provenance — populated for every resolution path so transcripts/rating can
  // tell matched from timed-out from best-effort fallback.
  eventId?: string;
  channel?: string;
  presentedAt?: number;
  wasAutoResolved?: boolean;
  pushBackStrikes?: number;
  playerAttempts?: PlayerAttempt[];
  matchConfidence?: number;
  matchSource?: DecisionMatchSource;
}

export interface DeliveredMessage {
  id: string;
  eventId: string;
  channel: string;
  from: string | 'player';
  content: string;
  timestamp: number;
  mentionsPlayer: boolean;
  contextValue: MessageContextValue | null;
  isPlayerMessage: boolean;
  // True for warm-start scrollback that establishes channel context before the
  // player arrived. UI renders these dimmed below a divider, distinct from
  // live messages. Stamped from GameEvent.isHistory at delivery time.
  isHistory?: boolean;
}

// ============================================================
// Content Schema — Stakeholders
// ============================================================

export interface StakeholderPersonality {
  mbtiType: string;
  enneagramType: number;
  enneagramWing: number;
  stressDirection: number;
  coreFear: string;
  coreDesire: string;
  communicationStyle: string;
  voiceRegister: string;
  voiceExamples: string[];
  // In-character clarifying push-back lines fired when the player's response
  // is too vague to match a choice. Picked deterministically per session.
  pushBackLines: string[];
}

export interface StakeholderMechanics {
  patience: number;
  directness: number;
  conflictStyle: ConflictStyle;
  politicalAwareness: number;
  escalationPattern: EscalationPattern;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  seniority: Seniority;
  statusEmoji: string;
  statusText: string;
  personality: StakeholderPersonality;
  mechanics: StakeholderMechanics;
}

export interface StakeholderTemplate extends Omit<Stakeholder, 'name'> {
  templateId: string;
  namePool: { firstName: string; lastName: string }[];
}

// ============================================================
// Content Schema — Events & Decisions
// ============================================================

export interface StateEffect {
  variable: VariableName;
  delta: number;
  tag: string;
}

export interface Choice {
  id: string;
  label: string;
  message: string;
  effects: StateEffect[];
  triggers?: string[];
  reactions?: ReactiveFollowUpTemplate[];
  tone: Tone;
  isDefer?: boolean;
  contradicts?: string;
}

export interface PlayerReplyAnalysis {
  rawText: string;
  matchedTone: Tone | null;
  signals: PlayerReplySignal[];
  addressedStakeholderIds: string[];
}

export interface ReactiveFollowUpTemplate {
  id: string;
  from: string;
  content: string;
  delay: number;
  mentionsPlayer?: boolean;
  contextValue?: MessageContextValue;
  when?: {
    matchedTones?: Tone[];
    hasAnySignals?: PlayerReplySignal[];
    addressedStakeholderIds?: string[];
  };
}

export interface EscalationStage {
  eventId: string;
  delay: number;
  effects: StateEffect[];
  replacementDecision?: Decision;
}

export interface Decision {
  id: string;
  timeout: number;
  choices: Choice[];
  escalation?: {
    stages: EscalationStage[];
    autoResolve?: {
      delay: number;
      effects: StateEffect[];
      description: string;
    };
  };
}

export interface EventMessage {
  id: string;
  from: string;
  content: string;
  delay: number;
  reactions?: { emoji: string; from: string[] }[];
  mentionsPlayer?: boolean;
  contextValue?: MessageContextValue;
}

export interface StateCondition {
  variable: VariableName;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
}

export interface GameEvent {
  id: string;
  triggerAt?: number;
  triggerAfter?: {
    eventId: string;
    delay: number;
  };
  condition?: StateCondition;
  // If set, the event is only loaded when the run's difficulty matches.
  // Used for difficulty-tiered onboarding content.
  difficulty?: Difficulty[];
  channel: string;
  messages: EventMessage[];
  decision?: Decision;
  priority?: EventPriority;
  // Marks this event as warm-start scrollback rather than a live exchange.
  // The scheduler stamps every message it materializes from this event with
  // isHistory: true so the UI can render them dimmed below a divider.
  // Authors should set this on pure backstory events (channel history
  // dumps that establish context), NOT on live first-touch DMs that
  // happen to fire at t=0.
  isHistory?: boolean;
}

// ============================================================
// Content Schema — Scenario
// ============================================================

export interface MessagePool {
  slotId: string;
  channel: string;
  window: { earliest: number; latest: number };
  variants: EventMessage[];
}

export interface EventSlot {
  slotId: string;
  window: { earliest: number; latest: number };
  events: string[];
}

export interface ChannelDef {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  description?: string;
  isNoise?: boolean;
  // When true, the player can't post — the composer is replaced with a
  // posts-only notice. Used for company-wide announcement channels.
  readOnly?: boolean;
}

export interface ScenarioWorldTemplate {
  templateId: string;
  // Pooled fields — engine picks one entry per session for procedural variation
  companyNamePool: string[];
  teamNamePool: string[];
  predecessorContextPool: string[];
  hqAddressPool: string[];
  // Fixed fields — same across every session in this template, shape the
  // strategic context the player walks into and the AI's system prompt
  productDescription: string;
  stage: string;
  annualThemes: string[];
  boardPressure: string;
  teamCharter: string;
  mandate: string;
  // Observable behaviors that constitute "doing the job credibly" today.
  // Surfaced on the Day 1 briefing so the player has anchors mid-game. Each
  // criterion should be qualitative and behavioral — players can check them
  // against themselves in real time without seeing hidden variables.
  successCriteria: string[];
  // Trailing one-liner shown under the success criteria. Holds the satirical
  // reality-check: doing well today doesn't actually get you promoted.
  successCriteriaFooter: string;
}

export interface ScenarioWorld {
  templateId: string;
  // Resolved from pools at session start
  companyName: string;
  teamName: string;
  predecessorContext: string;
  hqAddress: string;
  // Carried through from template
  productDescription: string;
  stage: string;
  annualThemes: string[];
  boardPressure: string;
  teamCharter: string;
  mandate: string;
  successCriteria: string[];
  successCriteriaFooter: string;
}

export interface Scenario {
  id: string;
  title: string;
  premise: string;
  durationTarget: number;
  worldTemplate: ScenarioWorldTemplate;
  stakeholders: StakeholderTemplate[];
  stakeholderPool?: {
    pool: StakeholderTemplate[];
    selectCount: number;
  };
  channels: ChannelDef[];
  initialActiveChannel?: string;
  events: GameEvent[];
  ambientPools: MessagePool[];
  eventSlots?: EventSlot[];
  initialState: Partial<GameVariables>;
  endCondition:
    | { type: 'all_events_resolved' }
    | { type: 'clock'; at: number };
}

// ============================================================
// Engine Actions
// ============================================================

export type EngineAction =
  | { type: 'deliver_message'; message: DeliveredMessage }
  | { type: 'present_decision'; decision: PendingDecision }
  | { type: 'escalate'; decisionId: string; stage: number }
  | {
      type: 'auto_resolve';
      decisionId: string;
      description: string;
      // Optional pre-built resolution. When present, processActions records this
      // directly instead of the legacy null-choice stub. EscalationManager fills
      // this in so the transcript captures eventId/channel/presentedAt/attempts.
      resolution?: ResolvedDecision;
    }
  | { type: 'update_state'; variable: VariableName; delta: number; tag: string }
  | { type: 'close_decision'; decisionId: string }
  | { type: 'typing_started'; channel: string; stakeholderId: string }
  | { type: 'end_game' };

// ============================================================
// Rating Engine
// ============================================================

export type CalibrationBucket =
  | 'needs_improvement'
  | 'partially_meets'
  | 'meets_expectations'
  | 'exceeds_expectations'
  | 'strongly_exceeds';

export type Archetype =
  | 'the_people_pleaser'
  | 'the_politician'
  | 'the_engineers_pm'
  | 'the_ghost'
  | 'the_diplomat'
  | 'the_cassandra'
  | 'the_bulldozer'
  | 'the_unicorn'
  | 'the_survivor';

export interface ConvictionResult {
  score: number;
  deferCount: number;
  contradictionCount: number;
}

export interface RatingResult {
  compositeScore: number;
  variables: GameVariables;
  calibrationBucket: CalibrationBucket;
  archetype: Archetype;
  conviction: ConvictionResult;
  managerReview: string;
  peerFeedback: { stakeholderId: string; feedback: string }[];
  calibrationOutcome: string;
}

// ============================================================
// Scoring Weights (satirically calibrated)
// ============================================================

export const SCORE_WEIGHTS: Record<VariableName, { weight: number; invert: boolean }> = {
  execTrust: { weight: 0.30, invert: false },
  communicationEffectiveness: { weight: 0.25, invert: false },
  teamMorale: { weight: 0.15, invert: false },
  productJudgment: { weight: 0.10, invert: false },
  techDebt: { weight: 0.10, invert: true },
  responsivenessDebt: { weight: 0.10, invert: true },
};
