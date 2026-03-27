import type { ModelPricing } from './types';

export const PRICING_REGISTRY_VERSION = '2026-03-25.1';

export const PRICING_REGISTRY: Record<string, ModelPricing> = {
  'openai:gpt-5-mini': {
    inputPer1M: 0.25,
    cachedInputPer1M: 0.025,
    outputPer1M: 2,
  },
  'openai:gpt-5-nano': {
    inputPer1M: 0.05,
    cachedInputPer1M: 0.005,
    outputPer1M: 0.4,
  },
  'openai:gpt-5.4': {
    inputPer1M: 2.5,
    cachedInputPer1M: 0.25,
    outputPer1M: 15,
  },
  'openai:gpt-5.4-pro': {
    inputPer1M: 15,
    cachedInputPer1M: 1.5,
    outputPer1M: 120,
  },
  'anthropic:claude-haiku-4-5': {
    inputPer1M: 1,
    cachedInputPer1M: 0.1,
    outputPer1M: 5,
  },
  'anthropic:claude-sonnet-4-5': {
    inputPer1M: 3,
    cachedInputPer1M: 0.3,
    outputPer1M: 15,
  },
  'anthropic:claude-sonnet-4-6': {
    inputPer1M: 3,
    cachedInputPer1M: 0.3,
    outputPer1M: 15,
  },
  'anthropic:claude-opus-4-6': {
    inputPer1M: 15,
    cachedInputPer1M: 1.5,
    outputPer1M: 75,
  },
  'local:analysis': {
    inputPer1M: 0,
    cachedInputPer1M: 0,
    outputPer1M: 0,
  },
  'local:dramatic': {
    inputPer1M: 0,
    cachedInputPer1M: 0,
    outputPer1M: 0,
  },
  'local:review': {
    inputPer1M: 0,
    cachedInputPer1M: 0,
    outputPer1M: 0,
  },
};

function getPricingEnvPrefix(modelKey: string): string {
  return `NTC_PRICING_${modelKey.replace(/[^A-Za-z0-9]+/g, '_').toUpperCase()}`;
}

function parseOverride(raw: string | undefined): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getPricingForModel(modelKey: string): ModelPricing {
  const base = PRICING_REGISTRY[modelKey] ?? {
    inputPer1M: 0,
    cachedInputPer1M: 0,
    outputPer1M: 0,
  };

  const prefix = getPricingEnvPrefix(modelKey);
  const inputPer1M = parseOverride(process.env[`${prefix}_INPUT_PER_1M`]);
  const cachedInputPer1M = parseOverride(
    process.env[`${prefix}_CACHED_INPUT_PER_1M`]
  );
  const outputPer1M = parseOverride(process.env[`${prefix}_OUTPUT_PER_1M`]);

  return {
    inputPer1M: inputPer1M ?? base.inputPer1M,
    cachedInputPer1M: cachedInputPer1M ?? base.cachedInputPer1M,
    outputPer1M: outputPer1M ?? base.outputPer1M,
  };
}
