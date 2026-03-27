import { analyzePlayerReply, CONFIDENCE_THRESHOLD } from '@/engine/ChoiceMatcher';
import { recordCostEvent } from '@/analytics/narrativeTelemetry';
import { buildPeerFeedback } from '@/review/buildPeerFeedback';
import { createTurnFallbackResponse, createFallbackReviewResponse } from './fallbacks';
import { applyNarrativeMemoryPatch, createEmptyNarrativeMemory } from './memory';
import { ModelRouter } from './router';
import { analyzeOutputSchema, realizeOutputSchema, reviewOutputSchema } from './schemas';
import { createNarrativeStores } from './storeFactory';
import { TASK_SPECS } from './taskSpecs';
import type { ProviderAdapter } from './provider';
import type {
  NarrativeAnalyzeOutput,
  NarrativeMemory,
  NarrativeReactionMessage,
  NarrativeRealizeOutput,
  NarrativeReviewRequest,
  NarrativeReviewResponse,
  NarrativeReviewOutput,
  NarrativeTurnRequest,
  NarrativeTurnResponse,
  TaskRunResult,
} from './types';
import { buildReviewPrompt, buildTurnAnalyzePrompt, buildTurnRealizePrompt } from './prompts';

function getPromptCacheKey(scenarioId: string, taskType: string, version: string): string {
  return `${scenarioId}:${taskType}:${version}`;
}

function computeComplexityScore(request: NarrativeTurnRequest, memory: NarrativeMemory): number {
  let score = 0;
  const involvedStakeholders = new Set(
    request.messages.slice(-8).map((message) => message.from).filter((from) => from !== 'player')
  );
  if (involvedStakeholders.size >= 2) score += 1;
  if (memory.openLoops.filter((loop) => loop.status === 'open').length >= 2) score += 1;
  if (
    request.engineSnapshot.resolvedDecisions.some(
      (decision) => decision.contradicts !== null
    )
  ) {
    score += 1;
  }
  if (request.decision.escalationStage > 0) score += 1;
  return score;
}

function assertChoiceId(request: NarrativeTurnRequest, choiceId: string | null): choiceId is string {
  return Boolean(choiceId && request.decision.choices.some((choice) => choice.id === choiceId));
}

function selectProvider(
  providers: Record<string, ProviderAdapter>,
  providerId: string
): ProviderAdapter | null {
  return providers[providerId] ?? null;
}

export class NarrativeService {
  private router = new ModelRouter();
  private stores = createNarrativeStores();
  private providers: Record<string, ProviderAdapter>;

  constructor(providers: Record<string, ProviderAdapter>) {
    this.providers = providers;
  }

  async runTurn(request: NarrativeTurnRequest): Promise<NarrativeTurnResponse> {
    const seededMemory =
      request.narrativeMemory ??
      (await this.stores.memoryStore.get(request.sessionId)) ??
      createEmptyNarrativeMemory();
    const fallbackResponse = createTurnFallbackResponse(
      request,
      seededMemory,
      'No model route available'
    );
    const baseComplexity = computeComplexityScore(request, seededMemory);
    const analyzeRoute = this.router.selectRoute({
      taskType: 'turn_analyze',
      complexityScore: baseComplexity,
    });
    const analyzeProvider =
      analyzeRoute.decision && analyzeRoute.entry
        ? selectProvider(this.providers, analyzeRoute.decision.providerId)
        : null;

    let analyzeRun: TaskRunResult<NarrativeAnalyzeOutput> | null = null;
    let analyzeResult: NarrativeAnalyzeOutput | null = null;

    if (analyzeProvider && analyzeRoute.entry && analyzeProvider.isConfigured()) {
      try {
        const prompt = buildTurnAnalyzePrompt(request, seededMemory);
        analyzeRun = await analyzeProvider.runStructured({
          model: analyzeRoute.entry,
          system: prompt.system,
          user: prompt.user,
          schema: analyzeOutputSchema,
          schemaName: 'NarrativeAnalyzeOutput',
          promptCacheKey: getPromptCacheKey(
            request.scenarioId,
            'turn_analyze',
            analyzeRoute.decision?.promptVersion ?? 'turn-analyze.v1'
          ),
          maxOutputTokens: TASK_SPECS.turn_analyze.maxOutputTokens,
          reasoningEffort: analyzeRoute.decision?.reasoningEffort,
          verbosity: analyzeRoute.decision?.verbosity,
          store: false,
        });
        analyzeResult = analyzeRun.parsed;
      } catch {
        analyzeResult = null;
      }
    }

    if (!analyzeResult || !assertChoiceId(request, analyzeResult.matchedChoiceId)) {
      return fallbackResponse;
    }

    const parsedAnalysis = analyzePlayerReply(
      request.playerText,
      request.stakeholders,
      analyzeResult.tone
    );
    const shouldNudge =
      analyzeResult.confidence < CONFIDENCE_THRESHOLD && !request.allowLowConfidenceMatch;

    const nextMemory = applyNarrativeMemoryPatch(seededMemory, analyzeResult.memoryPatch);

    let reactionMessages: NarrativeReactionMessage[] = [];
    let fallbackUsed = false;
    let fallbackReason: string | null = null;
    let routingDecision = analyzeRoute.decision;

    if (!shouldNudge) {
      const realizeComplexity = Math.max(baseComplexity, analyzeResult.complexityScore);
      const realizeRoute = this.router.selectRoute({
        taskType: 'turn_realize',
        complexityScore: realizeComplexity,
      });
      const realizeProvider =
        realizeRoute.decision && realizeRoute.entry
          ? selectProvider(this.providers, realizeRoute.decision.providerId)
          : null;

      if (realizeProvider && realizeRoute.entry && realizeProvider.isConfigured()) {
        try {
          const prompt = buildTurnRealizePrompt(
            request,
            nextMemory,
            analyzeResult.matchedChoiceId
          );
          const realizeRun = await realizeProvider.runStructured<NarrativeRealizeOutput>({
            model: realizeRoute.entry,
            system: prompt.system,
            user: prompt.user,
            schema: realizeOutputSchema,
            schemaName: 'NarrativeRealizeOutput',
            promptCacheKey: getPromptCacheKey(
              request.scenarioId,
              'turn_realize',
              realizeRoute.decision?.promptVersion ?? 'turn-realize.v1'
            ),
            maxOutputTokens: TASK_SPECS.turn_realize.maxOutputTokens,
            reasoningEffort: realizeRoute.decision?.reasoningEffort,
            verbosity: realizeRoute.decision?.verbosity,
            store: false,
          });

          const realizeResult = realizeRun.parsed;
          if (realizeResult) {
            reactionMessages = realizeResult.reactionMessages;
            routingDecision = realizeRoute.decision;
            await this.recordTaskRun(request.sessionId, 'turn_realize', realizeRun, false, realizeRoute.decision?.promptVersion ?? 'turn-realize.v1');
          }
        } catch {
          fallbackUsed = true;
          fallbackReason = 'Dynamic reaction generation failed';
        }
      }
    }

    await this.stores.memoryStore.put(request.sessionId, nextMemory);

    if (analyzeRun) {
      await this.recordTaskRun(
        request.sessionId,
        'turn_analyze',
        analyzeRun,
        fallbackUsed || shouldNudge,
        analyzeRoute.decision?.promptVersion ?? 'turn-analyze.v1'
      );
    }

    return {
      matchedChoiceId: shouldNudge ? null : analyzeResult.matchedChoiceId,
      confidence: analyzeResult.confidence,
      analysis: parsedAnalysis,
      memoryPatch: analyzeResult.memoryPatch,
      selectedBeatId: null,
      reactionMessages,
      routingDecision,
      fallbackUsed,
      fallbackReason,
      nudgeMessage: shouldNudge
        ? 'Could you say more? Try being more specific about what you want to do.'
        : null,
    };
  }

  async runReview(request: NarrativeReviewRequest): Promise<NarrativeReviewResponse> {
    const seededMemory =
      request.narrativeMemory ??
      (await this.stores.memoryStore.get(request.sessionId)) ??
      createEmptyNarrativeMemory();
    const defaultResult = buildPeerFeedback(request.ratingResult);
    const route = this.router.selectRoute({
      taskType: 'review_compose',
      complexityScore: Math.min(4, seededMemory.notableMoments.length > 2 ? 2 : 1),
    });
    const provider =
      route.decision && route.entry
        ? selectProvider(this.providers, route.decision.providerId)
        : null;

    if (!provider || !route.entry || !provider.isConfigured()) {
      return createFallbackReviewResponse(
        { ...request, ratingResult: defaultResult },
        'Review model is not configured'
      );
    }

    try {
      const prompt = buildReviewPrompt(
        { ...request, ratingResult: defaultResult },
        seededMemory
      );
      const reviewRun = await provider.runStructured<NarrativeReviewOutput>({
        model: route.entry,
        system: prompt.system,
        user: prompt.user,
        schema: reviewOutputSchema,
        schemaName: 'NarrativeReviewOutput',
        promptCacheKey: getPromptCacheKey(
          request.scenarioId,
          'review_compose',
          route.decision?.promptVersion ?? 'review-compose.v1'
        ),
        maxOutputTokens: TASK_SPECS.review_compose.maxOutputTokens,
        reasoningEffort: route.decision?.reasoningEffort,
        verbosity: route.decision?.verbosity,
        store: false,
      });

      await this.recordTaskRun(
        request.sessionId,
        'review_compose',
        reviewRun,
        false,
        route.decision?.promptVersion ?? 'review-compose.v1'
      );

      if (!reviewRun.parsed) {
        return createFallbackReviewResponse(
          { ...request, ratingResult: defaultResult },
          'Review generation returned no parsed content'
        );
      }

      return {
        managerReview: reviewRun.parsed.managerReview,
        peerFeedback: reviewRun.parsed.peerFeedback.length > 0
          ? reviewRun.parsed.peerFeedback
          : defaultResult.peerFeedback,
        calibrationOutcome:
          reviewRun.parsed.calibrationOutcome ?? defaultResult.calibrationOutcome,
        routingDecision: route.decision,
        fallbackUsed: false,
        fallbackReason: null,
      };
    } catch {
      return createFallbackReviewResponse(
        { ...request, ratingResult: defaultResult },
        'Review generation failed'
      );
    }
  }

  async resetSession(sessionId: string): Promise<void> {
    await this.stores.memoryStore.delete(sessionId);
  }

  private async recordTaskRun(
    sessionId: string,
    taskType: string,
    run: TaskRunResult<unknown>,
    fallbackUsed: boolean,
    promptVersion: string
  ): Promise<void> {
    recordCostEvent({
      sessionId,
      taskType,
      providerId: run.providerId,
      modelId: run.modelId,
      snapshot: run.snapshot,
      latencyMs: run.latencyMs,
      estimatedCostUsd: run.estimatedCostUsd,
      inputTokens: run.usage.inputTokens,
      outputTokens: run.usage.outputTokens,
      cachedInputTokens: run.usage.cachedInputTokens,
      reasoningTokens: run.usage.reasoningTokens,
      cacheHit: run.cache.hit,
      fallbackUsed,
      promptVersion,
      schemaVersion: '2026-03-25.1',
      recordedAt: Date.now(),
    });

    await this.stores.traceStore.append({
      sessionId,
      taskType,
      providerId: run.providerId,
      modelId: run.modelId,
      latencyMs: run.latencyMs,
      estimatedCostUsd: run.estimatedCostUsd,
      fallbackUsed,
      promptVersion,
      schemaVersion: '2026-03-25.1',
      createdAt: Date.now(),
    });
  }
}

let serviceSingleton: NarrativeService | null = null;

export function getNarrativeService(providers: Record<string, ProviderAdapter>): NarrativeService {
  if (!serviceSingleton) {
    serviceSingleton = new NarrativeService(providers);
  }
  return serviceSingleton;
}
