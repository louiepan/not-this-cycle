import type {
  Choice,
  Difficulty,
  GameState,
  MessageContextValue,
  PlayerReplyAnalysis,
  PlayerReplySignal,
  RatingResult,
  Stakeholder,
  Tone,
} from '@/engine/types';

export type NarrativeTaskType =
  | 'turn_analyze'
  | 'turn_realize'
  | 'turn_guardrail_lint'
  | 'review_compose'
  | 'offline_eval'
  | 'routing_benchmark';

export type ModelPolicySlot =
  | 'economy_structured'
  | 'dramatic_fast'
  | 'dramatic_strong'
  | 'review_strong'
  | 'validator_lowcost'
  | 'offline_judge';

export type QualityTier = 'economy' | 'balanced' | 'premium';

export type TaskFallback =
  | 'heuristic_matcher'
  | 'authored_reactions'
  | 'authored_review'
  | 'static_choice'
  | 'skip_generation';

export interface TaskSpec {
  taskType: NarrativeTaskType;
  requiresStructuredOutput: boolean;
  maxLatencyMs: number;
  maxOutputTokens: number;
  qualityTier: QualityTier;
  allowedFallbacks: TaskFallback[];
}

export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
}

export interface ProviderCacheUsage {
  hit: boolean;
  promptCacheKey?: string;
}

export interface ModelCapabilitySet {
  supportsStructuredOutput: boolean;
  supportsTextOutput: boolean;
  supportsPromptCaching: boolean;
  supportsReasoningEffort: boolean;
  supportsToolUse: boolean;
  supportsLocalRuntime: boolean;
}

export interface ModelPricing {
  inputPer1M: number;
  cachedInputPer1M: number;
  outputPer1M: number;
}

export interface ModelDefaultParams {
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high' | 'xhigh';
  verbosity?: 'low' | 'medium' | 'high';
  store?: boolean;
}

export interface ModelRegistryEntry {
  id: string;
  providerId: string;
  modelId: string;
  snapshot: string;
  capabilities: ModelCapabilitySet;
  pricing: ModelPricing;
  defaultParams: ModelDefaultParams;
  enabledEnvironments: Array<'development' | 'test' | 'production'>;
}

export interface TaskRunResult<TParsed> {
  parsed: TParsed | null;
  rawText: string;
  usage: ProviderUsage;
  latencyMs: number;
  estimatedCostUsd: number;
  cache: ProviderCacheUsage;
  providerResponseId: string | null;
  warnings: string[];
  providerId: string;
  modelId: string;
  snapshot: string;
}

export interface NarrativeDecisionContext {
  decisionId: string;
  eventId: string;
  channelId: string;
  presentedAt: number;
  timeout: number;
  escalationStage: number;
  choices: Choice[];
}

export interface NarrativeMessageContext {
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

export interface NarrativeStakeholderState {
  trust: number;
  tension: number;
  impatience: number;
  helpfulness: number;
  lastUpdatedAt: number;
}

export interface NarrativeOpenLoop {
  id: string;
  stakeholderId: string | null;
  summary: string;
  sourceDecisionId: string | null;
  status: 'open' | 'resolved' | 'stale';
  createdAt: number;
}

export interface RoomBelief {
  audience: string;
  belief: string;
  confidence: number;
  updatedAt: number;
}

export interface DecisionLedgerEntry {
  decisionId: string;
  choiceId: string | null;
  summary: string;
  timestamp: number;
  tags: string[];
}

export interface NarrativeMoment {
  id: string;
  type: 'commitment' | 'contradiction' | 'escalation' | 'ownership' | 'ghosting';
  summary: string;
  stakeholderIds: string[];
  timestamp: number;
}

export interface NarrativeMemory {
  stakeholderStates: Record<string, NarrativeStakeholderState>;
  openLoops: NarrativeOpenLoop[];
  roomBeliefs: RoomBelief[];
  decisionLedger: DecisionLedgerEntry[];
  notableMoments: NarrativeMoment[];
}

export interface NarrativeMemoryPatch {
  stakeholderStates?: Record<string, Partial<NarrativeStakeholderState>>;
  openLoops?: NarrativeOpenLoop[];
  resolvedOpenLoopIds?: string[];
  roomBeliefs?: RoomBelief[];
  decisionLedgerEntry?: DecisionLedgerEntry;
  notableMoments?: NarrativeMoment[];
}

export interface NarrativeReactionMessage {
  id: string;
  from: string;
  content: string;
  delay: number;
  mentionsPlayer?: boolean;
  contextValue?: MessageContextValue;
}

export interface RoutingDecision {
  taskType: NarrativeTaskType;
  modelSlot: ModelPolicySlot;
  providerId: string;
  modelId: string;
  snapshot: string;
  reasoningEffort: 'none' | 'low' | 'medium' | 'high' | 'xhigh';
  verbosity: 'low' | 'medium' | 'high';
  complexityScore: number;
  reason: string;
  promptVersion: string;
}

export interface NarrativeTurnRequest {
  sessionId: string;
  scenarioId: string;
  seed: number;
  difficulty: Difficulty;
  playerText: string;
  allowLowConfidenceMatch?: boolean;
  stakeholders: Stakeholder[];
  messages: NarrativeMessageContext[];
  decision: NarrativeDecisionContext;
  engineSnapshot: Pick<GameState, 'variables' | 'resolvedDecisions' | 'pendingDecisions' | 'clock'>;
  narrativeMemory?: NarrativeMemory;
  allowedBeatIds: string[];
  fallbackPlan: TaskFallback[];
}

export interface NarrativeTurnResponse {
  matchedChoiceId: string | null;
  confidence: number;
  analysis: PlayerReplyAnalysis;
  memoryPatch: NarrativeMemoryPatch;
  selectedBeatId: string | null;
  reactionMessages: NarrativeReactionMessage[];
  routingDecision: RoutingDecision | null;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  nudgeMessage: string | null;
}

export interface NarrativeReviewRequest {
  sessionId: string;
  scenarioId: string;
  stakeholders: Stakeholder[];
  ratingResult: RatingResult;
  narrativeMemory?: NarrativeMemory;
}

export interface NarrativeReviewResponse {
  managerReview: string;
  peerFeedback: { stakeholderId: string; feedback: string }[];
  calibrationOutcome?: string;
  routingDecision: RoutingDecision | null;
  fallbackUsed: boolean;
  fallbackReason: string | null;
}

export interface NarrativeAnalyzeOutput {
  matchedChoiceId: string;
  confidence: number;
  tone: Tone | null;
  signals: PlayerReplySignal[];
  addressedStakeholderIds: string[];
  memoryPatch: NarrativeMemoryPatch;
  contradictionFlags: string[];
  complexityScore: number;
}

export interface NarrativeRealizeOutput {
  selectedBeatId: string | null;
  reactionMessages: NarrativeReactionMessage[];
  toneTags: string[];
}

export interface NarrativeGuardrailOutput {
  passes: boolean;
  violations: string[];
}

export interface NarrativeReviewOutput {
  managerReview: string;
  peerFeedback: { stakeholderId: string; feedback: string }[];
  calibrationOutcome?: string;
}

export interface RoutingBenchmarkSample {
  configId: string;
  experienceScore: number;
  sessionCostUsd: number;
  p95LatencyMs: number;
  fallbackRate: number;
  parseFailureRate: number;
}

export interface ReplayOptimizerWeights {
  costWeight: number;
  latencyWeight: number;
  fallbackWeight: number;
}
