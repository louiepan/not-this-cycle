import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import type { ResponseUsage } from 'openai/resources/responses/responses';
import type { ProviderAdapter, StructuredRunRequest, TextRunRequest } from '../provider';
import type { ModelRegistryEntry, ProviderUsage, TaskRunResult } from '../types';

function normalizeUsage(usage?: ResponseUsage | null): ProviderUsage {
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    cachedInputTokens: usage?.input_tokens_details.cached_tokens ?? 0,
    reasoningTokens: usage?.output_tokens_details.reasoning_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
  };
}

export class OpenAIAdapter implements ProviderAdapter {
  readonly id = 'openai';
  private client: OpenAI | null;

  constructor(apiKey: string | undefined) {
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  capabilities(): string[] {
    return ['structured-output', 'text-output', 'prompt-caching', 'reasoning'];
  }

  async healthCheck(): Promise<{ ok: boolean; providerId: string; detail?: string }> {
    if (!this.client) {
      return { ok: false, providerId: this.id, detail: 'OPENAI_API_KEY is not configured' };
    }

    return { ok: true, providerId: this.id };
  }

  estimateCost(model: ModelRegistryEntry, usage: ProviderUsage): number {
    const uncachedInput = Math.max(0, usage.inputTokens - usage.cachedInputTokens);
    const inputCost = (uncachedInput / 1_000_000) * model.pricing.inputPer1M;
    const cachedCost = (usage.cachedInputTokens / 1_000_000) * model.pricing.cachedInputPer1M;
    const outputCost = (usage.outputTokens / 1_000_000) * model.pricing.outputPer1M;
    return Number((inputCost + cachedCost + outputCost).toFixed(6));
  }

  async runStructured<TParsed>(request: StructuredRunRequest<TParsed>): Promise<TaskRunResult<TParsed>> {
    if (!this.client) {
      throw new Error('OpenAI provider is not configured');
    }

    const started = performance.now();
    const response = await this.client.responses.parse({
      model: request.model.modelId,
      instructions: request.system,
      input: request.user,
      store: request.store ?? request.model.defaultParams.store ?? false,
      prompt_cache_key: request.promptCacheKey,
      max_output_tokens: request.maxOutputTokens,
      reasoning: request.reasoningEffort ? { effort: request.reasoningEffort } : undefined,
      text: {
        verbosity: request.verbosity ?? request.model.defaultParams.verbosity ?? 'low',
        format: zodTextFormat(request.schema, request.schemaName),
      },
    });
    const latencyMs = Math.round(performance.now() - started);
    const usage = normalizeUsage(response.usage);

    return {
      parsed: response.output_parsed ?? null,
      rawText: response.output_text ?? '',
      usage,
      latencyMs,
      estimatedCostUsd: this.estimateCost(request.model, usage),
      cache: {
        hit: usage.cachedInputTokens > 0,
        promptCacheKey: request.promptCacheKey,
      },
      providerResponseId: response.id,
      warnings: [],
      providerId: this.id,
      modelId: request.model.modelId,
      snapshot: request.model.snapshot,
    };
  }

  async runText(request: TextRunRequest): Promise<TaskRunResult<string>> {
    if (!this.client) {
      throw new Error('OpenAI provider is not configured');
    }

    const started = performance.now();
    const response = await this.client.responses.create({
      model: request.model.modelId,
      instructions: request.system,
      input: request.user,
      store: request.store ?? request.model.defaultParams.store ?? false,
      prompt_cache_key: request.promptCacheKey,
      max_output_tokens: request.maxOutputTokens,
      reasoning: request.reasoningEffort ? { effort: request.reasoningEffort } : undefined,
      text: {
        verbosity: request.verbosity ?? request.model.defaultParams.verbosity ?? 'low',
      },
    });
    const latencyMs = Math.round(performance.now() - started);
    const usage = normalizeUsage(response.usage);

    return {
      parsed: response.output_text ?? null,
      rawText: response.output_text ?? '',
      usage,
      latencyMs,
      estimatedCostUsd: this.estimateCost(request.model, usage),
      cache: {
        hit: usage.cachedInputTokens > 0,
        promptCacheKey: request.promptCacheKey,
      },
      providerResponseId: response.id,
      warnings: [],
      providerId: this.id,
      modelId: request.model.modelId,
      snapshot: request.model.snapshot,
    };
  }
}
