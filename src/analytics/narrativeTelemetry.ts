import type { CostEvent, RoutingEvalResult } from './events';

function getGlobalStore() {
  const globalState = globalThis as typeof globalThis & {
    __ntcNarrativeTelemetry?: {
      costEvents: CostEvent[];
      routingEvals: RoutingEvalResult[];
    };
  };

  if (!globalState.__ntcNarrativeTelemetry) {
    globalState.__ntcNarrativeTelemetry = {
      costEvents: [],
      routingEvals: [],
    };
  }

  return globalState.__ntcNarrativeTelemetry;
}

export function recordCostEvent(event: CostEvent): void {
  const store = getGlobalStore();
  store.costEvents.push(event);
}

export function listCostEvents(): CostEvent[] {
  return [...getGlobalStore().costEvents];
}

export function recordRoutingEval(result: RoutingEvalResult): void {
  const store = getGlobalStore();
  store.routingEvals.push(result);
}

export function listRoutingEvals(): RoutingEvalResult[] {
  return [...getGlobalStore().routingEvals];
}
