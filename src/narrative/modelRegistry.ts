import { getPricingForModel } from './pricingRegistry';
import type { ModelPolicySlot, ModelRegistryEntry } from './types';

export const MODEL_REGISTRY_VERSION = '2026-03-25.1';

const OPENAI_CAPABILITIES = {
  supportsStructuredOutput: true,
  supportsTextOutput: true,
  supportsPromptCaching: true,
  supportsReasoningEffort: true,
  supportsToolUse: true,
  supportsLocalRuntime: false,
} as const;

const LOCAL_CAPABILITIES = {
  supportsStructuredOutput: true,
  supportsTextOutput: true,
  supportsPromptCaching: false,
  supportsReasoningEffort: false,
  supportsToolUse: false,
  supportsLocalRuntime: true,
} as const;

const ANTHROPIC_CAPABILITIES = {
  supportsStructuredOutput: true,
  supportsTextOutput: true,
  supportsPromptCaching: false,
  supportsReasoningEffort: true,
  supportsToolUse: true,
  supportsLocalRuntime: false,
} as const;

export const MODEL_REGISTRY: Record<string, ModelRegistryEntry> = {
  'openai:gpt-5-mini': {
    id: 'openai:gpt-5-mini',
    providerId: 'openai',
    modelId: 'gpt-5-mini',
    snapshot: '2026-03-default',
    capabilities: OPENAI_CAPABILITIES,
    pricing: getPricingForModel('openai:gpt-5-mini'),
    defaultParams: {
      reasoningEffort: 'none',
      verbosity: 'low',
      store: false,
    },
    enabledEnvironments: ['development', 'test', 'production'],
  },
  'openai:gpt-5-nano': {
    id: 'openai:gpt-5-nano',
    providerId: 'openai',
    modelId: 'gpt-5-nano',
    snapshot: '2026-03-default',
    capabilities: OPENAI_CAPABILITIES,
    pricing: getPricingForModel('openai:gpt-5-nano'),
    defaultParams: {
      reasoningEffort: 'none',
      verbosity: 'low',
      store: false,
    },
    enabledEnvironments: ['development', 'test', 'production'],
  },
  'openai:gpt-5.4': {
    id: 'openai:gpt-5.4',
    providerId: 'openai',
    modelId: 'gpt-5.4',
    snapshot: '2026-03-default',
    capabilities: OPENAI_CAPABILITIES,
    pricing: getPricingForModel('openai:gpt-5.4'),
    defaultParams: {
      reasoningEffort: 'low',
      verbosity: 'medium',
      store: false,
    },
    enabledEnvironments: ['development', 'test', 'production'],
  },
  'openai:gpt-5.4-pro': {
    id: 'openai:gpt-5.4-pro',
    providerId: 'openai',
    modelId: 'gpt-5.4-pro',
    snapshot: '2026-03-default',
    capabilities: OPENAI_CAPABILITIES,
    pricing: getPricingForModel('openai:gpt-5.4-pro'),
    defaultParams: {
      reasoningEffort: 'medium',
      verbosity: 'medium',
      store: false,
    },
    enabledEnvironments: ['development', 'test', 'production'],
  },
  'anthropic:claude-haiku-4-5': {
    id: 'anthropic:claude-haiku-4-5',
    providerId: 'anthropic',
    modelId: 'claude-haiku-4-5',
    snapshot: '2026-03-default',
    capabilities: ANTHROPIC_CAPABILITIES,
    pricing: getPricingForModel('anthropic:claude-haiku-4-5'),
    defaultParams: {
      reasoningEffort: 'none',
      verbosity: 'low',
      store: false,
    },
    enabledEnvironments: ['development', 'test', 'production'],
  },
  'anthropic:claude-sonnet-4-5': {
    id: 'anthropic:claude-sonnet-4-5',
    providerId: 'anthropic',
    modelId: 'claude-sonnet-4-5',
    snapshot: '2026-03-default',
    capabilities: ANTHROPIC_CAPABILITIES,
    pricing: getPricingForModel('anthropic:claude-sonnet-4-5'),
    defaultParams: {
      reasoningEffort: 'low',
      verbosity: 'medium',
      store: false,
    },
    enabledEnvironments: ['development', 'test', 'production'],
  },
  'anthropic:claude-sonnet-4-6': {
    id: 'anthropic:claude-sonnet-4-6',
    providerId: 'anthropic',
    modelId: 'claude-sonnet-4-6',
    snapshot: '2026-03-default',
    capabilities: ANTHROPIC_CAPABILITIES,
    pricing: getPricingForModel('anthropic:claude-sonnet-4-6'),
    defaultParams: {
      reasoningEffort: 'low',
      verbosity: 'medium',
      store: false,
    },
    enabledEnvironments: ['development', 'test', 'production'],
  },
  'anthropic:claude-opus-4-6': {
    id: 'anthropic:claude-opus-4-6',
    providerId: 'anthropic',
    modelId: 'claude-opus-4-6',
    snapshot: '2026-03-default',
    capabilities: ANTHROPIC_CAPABILITIES,
    pricing: getPricingForModel('anthropic:claude-opus-4-6'),
    defaultParams: {
      reasoningEffort: 'medium',
      verbosity: 'medium',
      store: false,
    },
    enabledEnvironments: ['development', 'test', 'production'],
  },
  'local:analysis': {
    id: 'local:analysis',
    providerId: 'local-openai-compatible',
    modelId: 'local-analysis',
    snapshot: 'dev-local',
    capabilities: LOCAL_CAPABILITIES,
    pricing: getPricingForModel('local:analysis'),
    defaultParams: {
      verbosity: 'low',
      store: false,
    },
    enabledEnvironments: ['development', 'test'],
  },
  'local:dramatic': {
    id: 'local:dramatic',
    providerId: 'local-openai-compatible',
    modelId: 'local-dramatic',
    snapshot: 'dev-local',
    capabilities: LOCAL_CAPABILITIES,
    pricing: getPricingForModel('local:dramatic'),
    defaultParams: {
      verbosity: 'medium',
      store: false,
    },
    enabledEnvironments: ['development', 'test'],
  },
  'local:review': {
    id: 'local:review',
    providerId: 'local-openai-compatible',
    modelId: 'local-review',
    snapshot: 'dev-local',
    capabilities: LOCAL_CAPABILITIES,
    pricing: getPricingForModel('local:review'),
    defaultParams: {
      verbosity: 'medium',
      store: false,
    },
    enabledEnvironments: ['development', 'test'],
  },
};

export const DEFAULT_MODEL_POLICY: Record<ModelPolicySlot, string> = {
  economy_structured: 'openai:gpt-5-mini',
  dramatic_fast: 'openai:gpt-5-mini',
  dramatic_strong: 'openai:gpt-5.4',
  review_strong: 'openai:gpt-5.4',
  validator_lowcost: 'openai:gpt-5-nano',
  offline_judge: 'openai:gpt-5.4-pro',
};

export function getModelRegistryEntry(id: string): ModelRegistryEntry | null {
  return MODEL_REGISTRY[id] ?? null;
}

export function resolveModelPolicyOverrides(): Partial<Record<ModelPolicySlot, string>> {
  const rawOverrides: Partial<Record<ModelPolicySlot, string | undefined>> = {
    economy_structured: process.env.NTC_MODEL_SLOT_ECONOMY_STRUCTURED,
    dramatic_fast: process.env.NTC_MODEL_SLOT_DRAMATIC_FAST,
    dramatic_strong: process.env.NTC_MODEL_SLOT_DRAMATIC_STRONG,
    review_strong: process.env.NTC_MODEL_SLOT_REVIEW_STRONG,
    validator_lowcost: process.env.NTC_MODEL_SLOT_VALIDATOR_LOWCOST,
    offline_judge: process.env.NTC_MODEL_SLOT_OFFLINE_JUDGE,
  };

  const overrides: Partial<Record<ModelPolicySlot, string>> = {};
  for (const [slot, value] of Object.entries(rawOverrides)) {
    if (value) {
      overrides[slot as ModelPolicySlot] = value;
    }
  }

  return overrides;
}
