import type { NarrativeTaskType, TaskSpec } from './types';

export const TASK_SPECS: Record<NarrativeTaskType, TaskSpec> = {
  turn_analyze: {
    taskType: 'turn_analyze',
    requiresStructuredOutput: true,
    maxLatencyMs: 1200,
    maxOutputTokens: 500,
    qualityTier: 'economy',
    allowedFallbacks: ['heuristic_matcher', 'static_choice'],
  },
  turn_realize: {
    taskType: 'turn_realize',
    requiresStructuredOutput: true,
    maxLatencyMs: 1600,
    maxOutputTokens: 700,
    qualityTier: 'balanced',
    allowedFallbacks: ['authored_reactions', 'skip_generation'],
  },
  turn_guardrail_lint: {
    taskType: 'turn_guardrail_lint',
    requiresStructuredOutput: true,
    maxLatencyMs: 700,
    maxOutputTokens: 250,
    qualityTier: 'economy',
    allowedFallbacks: ['skip_generation'],
  },
  review_compose: {
    taskType: 'review_compose',
    requiresStructuredOutput: true,
    maxLatencyMs: 3000,
    maxOutputTokens: 1200,
    qualityTier: 'premium',
    allowedFallbacks: ['authored_review'],
  },
  offline_eval: {
    taskType: 'offline_eval',
    requiresStructuredOutput: true,
    maxLatencyMs: 15000,
    maxOutputTokens: 1500,
    qualityTier: 'premium',
    allowedFallbacks: ['skip_generation'],
  },
  routing_benchmark: {
    taskType: 'routing_benchmark',
    requiresStructuredOutput: true,
    maxLatencyMs: 15000,
    maxOutputTokens: 1500,
    qualityTier: 'premium',
    allowedFallbacks: ['skip_generation'],
  },
};
