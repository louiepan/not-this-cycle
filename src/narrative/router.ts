import { DEFAULT_MODEL_POLICY, getModelRegistryEntry, MODEL_REGISTRY_VERSION, resolveModelPolicyOverrides } from './modelRegistry';
import type {
  ModelPolicySlot,
  ModelRegistryEntry,
  NarrativeTaskType,
  RoutingDecision,
} from './types';

const PROMPT_VERSIONS: Record<NarrativeTaskType, string> = {
  turn_analyze: 'turn-analyze.v1',
  turn_realize: 'turn-realize.v1',
  turn_guardrail_lint: 'turn-guardrail.v1',
  review_compose: 'review-compose.v1',
  offline_eval: 'offline-eval.v1',
  routing_benchmark: 'routing-benchmark.v1',
};

export interface RouteSelectionInput {
  taskType: NarrativeTaskType;
  complexityScore: number;
}

function slotForTask(taskType: NarrativeTaskType, complexityScore: number): ModelPolicySlot {
  switch (taskType) {
    case 'turn_analyze':
      return 'economy_structured';
    case 'turn_realize':
      return complexityScore >= 2 ? 'dramatic_strong' : 'dramatic_fast';
    case 'turn_guardrail_lint':
      return 'validator_lowcost';
    case 'review_compose':
      return 'review_strong';
    case 'offline_eval':
    case 'routing_benchmark':
      return 'offline_judge';
  }
}

export class ModelRouter {
  resolvePolicy(): Record<ModelPolicySlot, string> {
    return {
      ...DEFAULT_MODEL_POLICY,
      ...resolveModelPolicyOverrides(),
    };
  }

  selectRoute(input: RouteSelectionInput): { entry: ModelRegistryEntry | null; decision: RoutingDecision | null } {
    const slot = slotForTask(input.taskType, input.complexityScore);
    const modelId = this.resolvePolicy()[slot];
    const entry = getModelRegistryEntry(modelId);

    if (!entry) {
      return { entry: null, decision: null };
    }

    return {
      entry,
      decision: {
        taskType: input.taskType,
        modelSlot: slot,
        providerId: entry.providerId,
        modelId: entry.modelId,
        snapshot: `${entry.snapshot}:${MODEL_REGISTRY_VERSION}`,
        reasoningEffort: entry.defaultParams.reasoningEffort ?? 'none',
        verbosity: entry.defaultParams.verbosity ?? 'low',
        complexityScore: input.complexityScore,
        reason: `${slot} selected for ${input.taskType} at complexity ${input.complexityScore}`,
        promptVersion: PROMPT_VERSIONS[input.taskType],
      },
    };
  }
}
