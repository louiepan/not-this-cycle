import type { z } from 'zod';
import type { ModelRegistryEntry, ProviderUsage, TaskRunResult } from './types';

export interface StructuredRunRequest<TParsed> {
  model: ModelRegistryEntry;
  system: string;
  user: string;
  schema: z.ZodType<TParsed>;
  schemaName: string;
  promptCacheKey: string;
  maxOutputTokens: number;
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high' | 'xhigh';
  verbosity?: 'low' | 'medium' | 'high';
  store?: boolean;
}

export interface TextRunRequest {
  model: ModelRegistryEntry;
  system: string;
  user: string;
  promptCacheKey: string;
  maxOutputTokens: number;
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high' | 'xhigh';
  verbosity?: 'low' | 'medium' | 'high';
  store?: boolean;
}

export interface ProviderAdapter {
  id: string;
  runStructured<TParsed>(request: StructuredRunRequest<TParsed>): Promise<TaskRunResult<TParsed>>;
  runText(request: TextRunRequest): Promise<TaskRunResult<string>>;
  estimateCost(model: ModelRegistryEntry, usage: ProviderUsage): number;
  capabilities(): string[];
  healthCheck(): Promise<{ ok: boolean; providerId: string; detail?: string }>;
  isConfigured(): boolean;
}
