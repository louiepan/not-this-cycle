import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type {
  Message,
  MessageParam,
  Usage,
} from '@anthropic-ai/sdk/resources/messages/messages';
import type {
  ProviderAdapter,
  StructuredRunRequest,
  TextRunRequest,
} from '../provider';
import type {
  ModelRegistryEntry,
  ProviderUsage,
  TaskRunResult,
} from '../types';

function normalizeUsage(usage?: Usage | null): ProviderUsage {
  const cacheCreationTokens = usage?.cache_creation_input_tokens ?? 0;
  const cacheReadTokens = usage?.cache_read_input_tokens ?? 0;
  const inputTokens = usage?.input_tokens ?? 0;
  const outputTokens = usage?.output_tokens ?? 0;
  const totalInputTokens = inputTokens + cacheCreationTokens + cacheReadTokens;

  return {
    inputTokens: totalInputTokens,
    outputTokens,
    cachedInputTokens: cacheReadTokens,
    reasoningTokens: 0,
    totalTokens: totalInputTokens + outputTokens,
  };
}

function extractText(message: Message): string {
  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n\n');
}

function buildMessages(user: string): MessageParam[] {
  return [
    {
      role: 'user',
      content: user,
    },
  ];
}

function mapThinking(
  effort: StructuredRunRequest<unknown>['reasoningEffort'] | TextRunRequest['reasoningEffort']
): { type: 'disabled' } | { type: 'adaptive'; display: 'omitted' } {
  if (!effort || effort === 'none') {
    return { type: 'disabled' };
  }

  return {
    type: 'adaptive',
    display: 'omitted',
  };
}

export class AnthropicAdapter implements ProviderAdapter {
  readonly id = 'anthropic';
  private client: Anthropic | null;

  constructor(apiKey: string | undefined) {
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  capabilities(): string[] {
    return ['structured-output', 'text-output', 'reasoning'];
  }

  async healthCheck(): Promise<{ ok: boolean; providerId: string; detail?: string }> {
    if (!this.client) {
      return {
        ok: false,
        providerId: this.id,
        detail: 'ANTHROPIC_API_KEY is not configured',
      };
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

  async runStructured<TParsed>(
    request: StructuredRunRequest<TParsed>
  ): Promise<TaskRunResult<TParsed>> {
    if (!this.client) {
      throw new Error('Anthropic provider is not configured');
    }

    const started = performance.now();
    const message = await this.client.messages.parse({
      model: request.model.modelId as Anthropic.Messages.Model,
      max_tokens: request.maxOutputTokens,
      system: request.system,
      messages: buildMessages(request.user),
      thinking: mapThinking(request.reasoningEffort),
      output_config: {
        format: zodOutputFormat(request.schema),
      },
    });
    const latencyMs = Math.round(performance.now() - started);
    const usage = normalizeUsage(message.usage);

    return {
      parsed: message.parsed_output ?? null,
      rawText: extractText(message),
      usage,
      latencyMs,
      estimatedCostUsd: this.estimateCost(request.model, usage),
      cache: {
        hit: usage.cachedInputTokens > 0,
        promptCacheKey: request.promptCacheKey,
      },
      providerResponseId: message.id,
      warnings: [],
      providerId: this.id,
      modelId: request.model.modelId,
      snapshot: request.model.snapshot,
    };
  }

  async runText(request: TextRunRequest): Promise<TaskRunResult<string>> {
    if (!this.client) {
      throw new Error('Anthropic provider is not configured');
    }

    const started = performance.now();
    const message = await this.client.messages.create({
      model: request.model.modelId as Anthropic.Messages.Model,
      max_tokens: request.maxOutputTokens,
      system: request.system,
      messages: buildMessages(request.user),
      thinking: mapThinking(request.reasoningEffort),
    });
    const latencyMs = Math.round(performance.now() - started);
    const usage = normalizeUsage(message.usage);
    const rawText = extractText(message);

    return {
      parsed: rawText,
      rawText,
      usage,
      latencyMs,
      estimatedCostUsd: this.estimateCost(request.model, usage),
      cache: {
        hit: usage.cachedInputTokens > 0,
        promptCacheKey: request.promptCacheKey,
      },
      providerResponseId: message.id,
      warnings: [],
      providerId: this.id,
      modelId: request.model.modelId,
      snapshot: request.model.snapshot,
    };
  }
}
