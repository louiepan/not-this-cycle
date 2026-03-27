import { afterEach, describe, expect, it } from 'vitest';
import { ModelRouter } from '../router';

describe('ModelRouter', () => {
  const router = new ModelRouter();

  afterEach(() => {
    delete process.env.NTC_MODEL_SLOT_DRAMATIC_FAST;
    delete process.env.NTC_MODEL_SLOT_DRAMATIC_STRONG;
  });

  it('routes turn analysis to the economy structured slot', () => {
    const result = router.selectRoute({
      taskType: 'turn_analyze',
      complexityScore: 0,
    });

    expect(result.decision?.modelSlot).toBe('economy_structured');
    expect(result.entry?.id).toBe('openai:gpt-5-mini');
  });

  it('routes simple dramatic turns to the fast dramatic slot', () => {
    const result = router.selectRoute({
      taskType: 'turn_realize',
      complexityScore: 1,
    });

    expect(result.decision?.modelSlot).toBe('dramatic_fast');
    expect(result.entry?.id).toBe('openai:gpt-5-mini');
  });

  it('routes complex dramatic turns to the strong dramatic slot', () => {
    const result = router.selectRoute({
      taskType: 'turn_realize',
      complexityScore: 3,
    });

    expect(result.decision?.modelSlot).toBe('dramatic_strong');
    expect(result.entry?.id).toBe('openai:gpt-5.4');
  });

  it('allows slot overrides through environment config', () => {
    process.env.NTC_MODEL_SLOT_DRAMATIC_FAST = 'anthropic:claude-sonnet-4-5';

    const result = router.selectRoute({
      taskType: 'turn_realize',
      complexityScore: 0,
    });

    expect(result.entry?.id).toBe('anthropic:claude-sonnet-4-5');
  });

  it('supports strong-slot overrides for provider A/B tests', () => {
    process.env.NTC_MODEL_SLOT_DRAMATIC_STRONG = 'anthropic:claude-opus-4-6';

    const result = router.selectRoute({
      taskType: 'turn_realize',
      complexityScore: 3,
    });

    expect(result.entry?.id).toBe('anthropic:claude-opus-4-6');
  });
});
