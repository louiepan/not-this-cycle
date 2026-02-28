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

export interface PendingDecision {
  decisionId: string;
  eventId: string;
  channel: string;
  presentedAt: number;
  timeout: number;
  choices: Choice[];
  escalationStage: number;
}

export interface ResolvedDecision {
  decisionId: string;
  choiceId: string | null; // null = auto-resolved
  resolvedAt: number;
  effects: StateEffect[];
  tags: string[];
  wasDefer: boolean;
  contradicts: string | null;
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
  tone: Tone;
  isDefer?: boolean;
  contradicts?: string;
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
  channel: string;
  messages: EventMessage[];
  decision?: Decision;
  priority?: EventPriority;
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
}

export interface Scenario {
  id: string;
  title: string;
  premise: string;
  durationTarget: number;
  stakeholders: StakeholderTemplate[];
  stakeholderPool?: {
    pool: StakeholderTemplate[];
    selectCount: number;
  };
  channels: ChannelDef[];
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
  | { type: 'auto_resolve'; decisionId: string; description: string }
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
