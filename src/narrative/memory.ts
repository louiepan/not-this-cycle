import type {
  NarrativeMemory,
  NarrativeMemoryPatch,
  NarrativeOpenLoop,
  NarrativeStakeholderState,
} from './types';

function mergeStakeholderState(
  current: NarrativeStakeholderState | undefined,
  patch: Partial<NarrativeStakeholderState>
): NarrativeStakeholderState {
  return {
    trust: patch.trust ?? current?.trust ?? 50,
    tension: patch.tension ?? current?.tension ?? 50,
    impatience: patch.impatience ?? current?.impatience ?? 50,
    helpfulness: patch.helpfulness ?? current?.helpfulness ?? 50,
    lastUpdatedAt: patch.lastUpdatedAt ?? current?.lastUpdatedAt ?? Date.now(),
  };
}

export function createEmptyNarrativeMemory(): NarrativeMemory {
  return {
    stakeholderStates: {},
    openLoops: [],
    roomBeliefs: [],
    decisionLedger: [],
    notableMoments: [],
  };
}

export function applyNarrativeMemoryPatch(
  current: NarrativeMemory,
  patch: NarrativeMemoryPatch
): NarrativeMemory {
  const next = createEmptyNarrativeMemory();
  next.stakeholderStates = { ...current.stakeholderStates };
  next.openLoops = [...current.openLoops];
  next.roomBeliefs = [...current.roomBeliefs];
  next.decisionLedger = [...current.decisionLedger];
  next.notableMoments = [...current.notableMoments];

  if (patch.stakeholderStates) {
    for (const [stakeholderId, partial] of Object.entries(patch.stakeholderStates)) {
      next.stakeholderStates[stakeholderId] = mergeStakeholderState(
        next.stakeholderStates[stakeholderId],
        partial
      );
    }
  }

  if (patch.openLoops) {
    const existing = new Map(next.openLoops.map((loop) => [loop.id, loop]));
    for (const loop of patch.openLoops) {
      existing.set(loop.id, loop);
    }
    next.openLoops = [...existing.values()];
  }

  if (patch.resolvedOpenLoopIds && patch.resolvedOpenLoopIds.length > 0) {
    const resolvedIds = new Set(patch.resolvedOpenLoopIds);
    next.openLoops = next.openLoops.map((loop) =>
      resolvedIds.has(loop.id) ? { ...loop, status: 'resolved' } : loop
    );
  }

  if (patch.roomBeliefs) {
    next.roomBeliefs.push(...patch.roomBeliefs);
  }

  if (patch.decisionLedgerEntry) {
    next.decisionLedger.push(patch.decisionLedgerEntry);
  }

  if (patch.notableMoments) {
    next.notableMoments.push(...patch.notableMoments);
  }

  return next;
}

export function createOpenLoop(
  summary: string,
  timestamp: number,
  stakeholderId: string | null,
  sourceDecisionId: string | null
): NarrativeOpenLoop {
  return {
    id: `loop-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    stakeholderId,
    summary,
    sourceDecisionId,
    status: 'open',
    createdAt: timestamp,
  };
}
