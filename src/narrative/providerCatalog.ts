import type { ProviderAdapter } from './provider';
import { AnthropicAdapter } from './providers/anthropicAdapter';
import { OpenAIAdapter } from './providers/openaiAdapter';
import { OpenAICompatibleAdapter } from './providers/openaiCompatibleAdapter';

export function createProviderCatalog(): Record<string, ProviderAdapter> {
  const openai = new OpenAIAdapter(process.env.OPENAI_API_KEY);
  const anthropic = new AnthropicAdapter(process.env.ANTHROPIC_API_KEY);
  const local = new OpenAICompatibleAdapter(
    process.env.LOCAL_LLM_BASE_URL,
    process.env.LOCAL_LLM_API_KEY
  );

  return {
    [openai.id]: openai,
    [anthropic.id]: anthropic,
    [local.id]: local,
  };
}
