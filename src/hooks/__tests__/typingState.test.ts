import { describe, expect, it } from 'vitest';
import type { Stakeholder } from '@/engine/types';
import {
  addTypingParticipant,
  getTypingNamesForChannel,
  removeTypingParticipant,
} from '../typingState';

const STAKEHOLDERS: Stakeholder[] = [
  {
    id: 'the-manager',
    name: 'Noel Baptiste',
    role: 'Manager',
    seniority: 'manager',
    statusEmoji: '🟢',
    statusText: 'Around',
    personality: {
      mbtiType: 'ENFJ',
      enneagramType: 3,
      enneagramWing: 2,
      stressDirection: 9,
      coreFear: 'Losing influence',
      coreDesire: 'Being valued',
      communicationStyle: 'Warm and calibrated',
    },
    mechanics: {
      patience: 0.5,
      directness: 0.5,
      conflictStyle: 'triangulate',
      politicalAwareness: 0.8,
      escalationPattern: 'go-around',
    },
  },
  {
    id: 'the-staff-eng',
    name: 'Sam Nakamura',
    role: 'Staff Engineer',
    seniority: 'ic',
    statusEmoji: '🟣',
    statusText: 'Heads down',
    personality: {
      mbtiType: 'INTJ',
      enneagramType: 5,
      enneagramWing: 6,
      stressDirection: 7,
      coreFear: 'Being incompetent',
      coreDesire: 'Mastery',
      communicationStyle: 'Blunt and precise',
    },
    mechanics: {
      patience: 0.4,
      directness: 0.9,
      conflictStyle: 'confront',
      politicalAwareness: 0.4,
      escalationPattern: 'go-silent',
    },
  },
];

describe('typingState', () => {
  it('keeps typing participants isolated by channel', () => {
    let state = {};
    state = addTypingParticipant(state, 'eng-team', 'the-staff-eng');
    state = addTypingParticipant(state, 'dm-manager', 'the-manager');

    expect(getTypingNamesForChannel(state, 'eng-team', STAKEHOLDERS)).toEqual([
      'Sam',
    ]);
    expect(
      getTypingNamesForChannel(state, 'dm-manager', STAKEHOLDERS)
    ).toEqual(['Noel']);
  });

  it('does not duplicate the same typing participant in a channel', () => {
    let state = {};
    state = addTypingParticipant(state, 'eng-team', 'the-staff-eng');
    state = addTypingParticipant(state, 'eng-team', 'the-staff-eng');

    expect(getTypingNamesForChannel(state, 'eng-team', STAKEHOLDERS)).toEqual([
      'Sam',
    ]);
  });

  it('removes only the delivered sender from the delivered channel', () => {
    let state = {};
    state = addTypingParticipant(state, 'eng-team', 'the-staff-eng');
    state = addTypingParticipant(state, 'dm-manager', 'the-manager');

    state = removeTypingParticipant(state, 'dm-manager', 'the-manager');

    expect(
      getTypingNamesForChannel(state, 'dm-manager', STAKEHOLDERS)
    ).toEqual([]);
    expect(getTypingNamesForChannel(state, 'eng-team', STAKEHOLDERS)).toEqual([
      'Sam',
    ]);
  });
});
