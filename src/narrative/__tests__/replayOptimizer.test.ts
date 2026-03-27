import { describe, expect, it } from 'vitest';
import { rankRoutingBenchmarks, scoreRoutingSample } from '../optimization/replayOptimizer';

describe('replay optimizer', () => {
  it('scores candidates by balancing experience, cost, latency, and fallback rate', () => {
    const score = scoreRoutingSample({
      configId: 'balanced',
      experienceScore: 84,
      sessionCostUsd: 0.12,
      p95LatencyMs: 1400,
      fallbackRate: 0.02,
      parseFailureRate: 0.01,
    });

    expect(score).toBeCloseTo(81.98, 2);
  });

  it('ranks passing configs ahead of cheaper configs that fail quality floors', () => {
    const ranked = rankRoutingBenchmarks([
      {
        configId: 'cheap-but-bad',
        experienceScore: 72,
        sessionCostUsd: 0.03,
        p95LatencyMs: 900,
        fallbackRate: 0.25,
        parseFailureRate: 0.15,
      },
      {
        configId: 'balanced',
        experienceScore: 83,
        sessionCostUsd: 0.11,
        p95LatencyMs: 1500,
        fallbackRate: 0.04,
        parseFailureRate: 0.02,
      },
    ]);

    expect(ranked[0].configId).toBe('balanced');
    expect(ranked[0].passedQualityFloor).toBe(true);
    expect(ranked[1].passedQualityFloor).toBe(false);
    expect(ranked[1].routingScore).toBe(Number.NEGATIVE_INFINITY);
  });
});
