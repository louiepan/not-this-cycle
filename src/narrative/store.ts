import { applyNarrativeMemoryPatch, createEmptyNarrativeMemory } from './memory';
import type { NarrativeMemory, NarrativeMemoryPatch } from './types';

export interface NarrativeMemoryStore {
  get(sessionId: string): Promise<NarrativeMemory>;
  put(sessionId: string, memory: NarrativeMemory): Promise<void>;
  patch(sessionId: string, patch: NarrativeMemoryPatch): Promise<NarrativeMemory>;
  delete(sessionId: string): Promise<void>;
}

export interface NarrativeTraceRecord {
  sessionId: string;
  taskType: string;
  providerId: string;
  modelId: string;
  latencyMs: number;
  estimatedCostUsd: number;
  fallbackUsed: boolean;
  promptVersion: string;
  schemaVersion: string;
  createdAt: number;
}

export interface NarrativeTraceStore {
  append(record: NarrativeTraceRecord): Promise<void>;
  listBySession(sessionId: string): Promise<NarrativeTraceRecord[]>;
}

function getGlobalNarrativeState() {
  const globalState = globalThis as typeof globalThis & {
    __ntcNarrativeStores?: {
      memory: Map<string, NarrativeMemory>;
      traces: NarrativeTraceRecord[];
    };
  };

  if (!globalState.__ntcNarrativeStores) {
    globalState.__ntcNarrativeStores = {
      memory: new Map(),
      traces: [],
    };
  }

  return globalState.__ntcNarrativeStores;
}

export class InMemoryNarrativeMemoryStore implements NarrativeMemoryStore {
  async get(sessionId: string): Promise<NarrativeMemory> {
    const memory = getGlobalNarrativeState().memory.get(sessionId);
    return memory ? structuredClone(memory) : createEmptyNarrativeMemory();
  }

  async put(sessionId: string, memory: NarrativeMemory): Promise<void> {
    getGlobalNarrativeState().memory.set(sessionId, structuredClone(memory));
  }

  async patch(sessionId: string, patch: NarrativeMemoryPatch): Promise<NarrativeMemory> {
    const current = await this.get(sessionId);
    const next = applyNarrativeMemoryPatch(current, patch);
    await this.put(sessionId, next);
    return next;
  }

  async delete(sessionId: string): Promise<void> {
    getGlobalNarrativeState().memory.delete(sessionId);
  }
}

export class InMemoryNarrativeTraceStore implements NarrativeTraceStore {
  async append(record: NarrativeTraceRecord): Promise<void> {
    getGlobalNarrativeState().traces.push(record);
  }

  async listBySession(sessionId: string): Promise<NarrativeTraceRecord[]> {
    return getGlobalNarrativeState().traces.filter((record) => record.sessionId === sessionId);
  }
}
