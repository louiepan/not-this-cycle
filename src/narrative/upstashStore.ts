import { applyNarrativeMemoryPatch, createEmptyNarrativeMemory } from './memory';
import type { NarrativeMemory, NarrativeMemoryPatch } from './types';
import type {
  NarrativeMemoryStore,
  NarrativeTraceRecord,
  NarrativeTraceStore,
} from './store';

class UpstashRedisClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string
  ) {}

  async request<T>(...command: (string | number)[]): Promise<T | null> {
    const response = await fetch(`${this.baseUrl}/${command.map(String).map(encodeURIComponent).join('/')}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Upstash request failed: ${response.status}`);
    }

    const body = (await response.json()) as { result?: T | null };
    return body.result ?? null;
  }
}

function getTtlSeconds(): number {
  const raw = process.env.NTC_NARRATIVE_TTL_SECONDS;
  const parsed = raw ? Number(raw) : 60 * 60 * 24;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60 * 60 * 24;
}

function memoryKey(sessionId: string): string {
  return `ntc:narrative:memory:${sessionId}`;
}

function traceKey(sessionId: string): string {
  return `ntc:narrative:traces:${sessionId}`;
}

export class UpstashNarrativeMemoryStore implements NarrativeMemoryStore {
  constructor(private readonly client: UpstashRedisClient) {}

  async get(sessionId: string): Promise<NarrativeMemory> {
    const result = await this.client.request<string>(`get`, memoryKey(sessionId));
    if (!result) {
      return createEmptyNarrativeMemory();
    }

    return JSON.parse(result) as NarrativeMemory;
  }

  async put(sessionId: string, memory: NarrativeMemory): Promise<void> {
    await this.client.request('set', memoryKey(sessionId), JSON.stringify(memory));
    await this.client.request('expire', memoryKey(sessionId), getTtlSeconds());
  }

  async patch(sessionId: string, patch: NarrativeMemoryPatch): Promise<NarrativeMemory> {
    const current = await this.get(sessionId);
    const next = applyNarrativeMemoryPatch(current, patch);
    await this.put(sessionId, next);
    return next;
  }

  async delete(sessionId: string): Promise<void> {
    await this.client.request('del', memoryKey(sessionId));
  }
}

export class UpstashNarrativeTraceStore implements NarrativeTraceStore {
  constructor(private readonly client: UpstashRedisClient) {}

  async append(record: NarrativeTraceRecord): Promise<void> {
    const key = traceKey(record.sessionId);
    await this.client.request('lpush', key, JSON.stringify(record));
    await this.client.request('ltrim', key, 0, 199);
    await this.client.request('expire', key, getTtlSeconds());
  }

  async listBySession(sessionId: string): Promise<NarrativeTraceRecord[]> {
    const result = await this.client.request<string[]>('lrange', traceKey(sessionId), 0, 199);
    return (result ?? []).map((item) => JSON.parse(item) as NarrativeTraceRecord);
  }
}

export function createUpstashStores():
  | { memoryStore: NarrativeMemoryStore; traceStore: NarrativeTraceStore }
  | null {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!baseUrl || !token) {
    return null;
  }

  const client = new UpstashRedisClient(baseUrl, token);
  return {
    memoryStore: new UpstashNarrativeMemoryStore(client),
    traceStore: new UpstashNarrativeTraceStore(client),
  };
}
