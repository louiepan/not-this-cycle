import { recordRoutingEval } from '@/analytics/narrativeTelemetry';
import type { ReplayOptimizerWeights, RoutingBenchmarkSample } from '../types';
import type { RoutingEvalResult } from '@/analytics/events';

const DEFAULT_WEIGHTS: ReplayOptimizerWeights = {
  costWeight: 1,
  latencyWeight: 0.001,
  fallbackWeight: 25,
};

export function scoreRoutingSample(
  sample: RoutingBenchmarkSample,
  weights: ReplayOptimizerWeights = DEFAULT_WEIGHTS
): number {
  return Number(
    (
      sample.experienceScore -
      weights.costWeight * sample.sessionCostUsd -
      weights.latencyWeight * sample.p95LatencyMs -
      weights.fallbackWeight * sample.fallbackRate
    ).toFixed(4)
  );
}

export function rankRoutingBenchmarks(
  samples: RoutingBenchmarkSample[],
  options?: {
    weights?: ReplayOptimizerWeights;
    maxParseFailureRate?: number;
    maxFallbackRate?: number;
  }
): RoutingEvalResult[] {
  const weights = options?.weights ?? DEFAULT_WEIGHTS;
  const maxParseFailureRate = options?.maxParseFailureRate ?? 0.08;
  const maxFallbackRate = options?.maxFallbackRate ?? 0.12;

  const ranked = samples
    .map((sample) => {
      const passedQualityFloor =
        sample.parseFailureRate <= maxParseFailureRate &&
        sample.fallbackRate <= maxFallbackRate;
      const result: RoutingEvalResult = {
        configId: sample.configId,
        experienceScore: sample.experienceScore,
        sessionCostUsd: sample.sessionCostUsd,
        p95LatencyMs: sample.p95LatencyMs,
        fallbackRate: sample.fallbackRate,
        parseFailureRate: sample.parseFailureRate,
        routingScore: passedQualityFloor ? scoreRoutingSample(sample, weights) : Number.NEGATIVE_INFINITY,
        passedQualityFloor,
        rankedAt: Date.now(),
      };
      recordRoutingEval(result);
      return result;
    })
    .sort((a, b) => b.routingScore - a.routingScore);

  return ranked;
}
