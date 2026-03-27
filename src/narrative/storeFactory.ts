import {
  InMemoryNarrativeMemoryStore,
  InMemoryNarrativeTraceStore,
  type NarrativeMemoryStore,
  type NarrativeTraceStore,
} from './store';
import { createUpstashStores } from './upstashStore';

export function createNarrativeStores(): {
  memoryStore: NarrativeMemoryStore;
  traceStore: NarrativeTraceStore;
} {
  const upstashStores = createUpstashStores();
  if (upstashStores) {
    return upstashStores;
  }

  return {
    memoryStore: new InMemoryNarrativeMemoryStore(),
    traceStore: new InMemoryNarrativeTraceStore(),
  };
}
