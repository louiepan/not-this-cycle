import { describe, expect, it } from 'vitest';
import { AnthropicAdapter } from '../providers/anthropicAdapter';
import { OpenAIAdapter } from '../providers/openaiAdapter';
import { getModelRegistryEntry } from '../modelRegistry';

describe('OpenAIAdapter estimateCost', () => {
  it('accounts for cached input tokens at the discounted rate', () => {
    const adapter = new OpenAIAdapter(undefined);
    const model = getModelRegistryEntry('openai:gpt-5-mini');

    expect(model).toBeTruthy();

    const estimated = adapter.estimateCost(model!, {
      inputTokens: 1_000_000,
      outputTokens: 500_000,
      cachedInputTokens: 400_000,
      reasoningTokens: 0,
      totalTokens: 1_500_000,
    });

    expect(estimated).toBeCloseTo(1.16, 5);
  });

  it('reports zero marginal cost for local models', () => {
    const adapter = new OpenAIAdapter(undefined);
    const model = getModelRegistryEntry('local:analysis');

    expect(model).toBeTruthy();

    const estimated = adapter.estimateCost(model!, {
      inputTokens: 500_000,
      outputTokens: 100_000,
      cachedInputTokens: 0,
      reasoningTokens: 0,
      totalTokens: 600_000,
    });

    expect(estimated).toBe(0);
  });

  it('supports anthropic pricing estimates for A/B tests', () => {
    const adapter = new AnthropicAdapter(undefined);
    const model = getModelRegistryEntry('anthropic:claude-sonnet-4-5');

    expect(model).toBeTruthy();

    const estimated = adapter.estimateCost(model!, {
      inputTokens: 1_000_000,
      outputTokens: 500_000,
      cachedInputTokens: 200_000,
      reasoningTokens: 0,
      totalTokens: 1_500_000,
    });

    expect(estimated).toBeCloseTo(9.96, 5);
  });
});
