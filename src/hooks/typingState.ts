import type { Stakeholder } from '@/engine/types';

export type TypingState = Record<string, string[]>;

export function addTypingParticipant(
  state: TypingState,
  channelId: string,
  stakeholderId: string
): TypingState {
  const existing = state[channelId] ?? [];
  if (existing.includes(stakeholderId)) {
    return state;
  }

  return {
    ...state,
    [channelId]: [...existing, stakeholderId],
  };
}

export function removeTypingParticipant(
  state: TypingState,
  channelId: string,
  stakeholderId: string
): TypingState {
  const existing = state[channelId] ?? [];
  if (!existing.includes(stakeholderId)) {
    return state;
  }

  const remaining = existing.filter((id) => id !== stakeholderId);
  if (remaining.length === 0) {
    const rest = { ...state };
    delete rest[channelId];
    return rest;
  }

  return {
    ...state,
    [channelId]: remaining,
  };
}

export function getTypingNamesForChannel(
  state: TypingState,
  channelId: string,
  stakeholders: Stakeholder[]
): string[] {
  const stakeholderIds = state[channelId] ?? [];

  return stakeholderIds
    .map((stakeholderId) => {
      const stakeholder = stakeholders.find((item) => item.id === stakeholderId);
      return stakeholder ? stakeholder.name.split(' ')[0] : null;
    })
    .filter((name): name is string => name !== null);
}
