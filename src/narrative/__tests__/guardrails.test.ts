import { describe, expect, it } from 'vitest';
import { sanitizeRealizeOutput } from '../guardrails';
import type { Choice, Stakeholder } from '@/engine/types';
import type { NarrativeRealizeOutput } from '../types';

const STAKEHOLDERS: Stakeholder[] = [
  {
    id: 'the-vp',
    name: 'Sarah Chen',
    role: 'VP of Product',
    seniority: 'vp',
    statusEmoji: '🎯',
    statusText: 'Q4 Planning',
    personality: {
      mbtiType: 'ENTJ',
      enneagramType: 3,
      enneagramWing: 4,
      stressDirection: 9,
      coreFear: 'Being ineffective',
      coreDesire: 'Impact',
      communicationStyle: 'direct',
    },
    mechanics: {
      patience: 0.4,
      directness: 0.9,
      conflictStyle: 'confront',
      politicalAwareness: 0.95,
      escalationPattern: 'go-public',
    },
  },
  {
    id: 'the-manager',
    name: 'Noel Baptiste',
    role: 'Director of Product',
    seniority: 'director',
    statusEmoji: '📅',
    statusText: 'Back-to-backs',
    personality: {
      mbtiType: 'INFJ',
      enneagramType: 9,
      enneagramWing: 1,
      stressDirection: 6,
      coreFear: 'Conflict spilling upward',
      coreDesire: 'Calm orderly delivery',
      communicationStyle: 'measured',
    },
    mechanics: {
      patience: 0.7,
      directness: 0.5,
      conflictStyle: 'absorb',
      politicalAwareness: 0.85,
      escalationPattern: 'go-silent',
    },
  },
];

const MATCHED_CHOICE: Choice = {
  id: 'choice-data-surface',
  label: 'Surface the data',
  message: 'We should surface this before the plan gets locked.',
  effects: [{ variable: 'productJudgment', delta: 10, tag: 'data-driven' }],
  tone: 'direct',
  triggers: ['evt-vp-data-reaction'],
  reactions: [
    {
      id: 'react-data-surface-default',
      from: 'the-data-analyst',
      delay: 1500,
      content: 'Thanks. Mildly unpopular now is still better than spectacularly wrong later.',
    },
  ],
};

function build(output: Partial<NarrativeRealizeOutput>): NarrativeRealizeOutput {
  return {
    selectedBeatId: null,
    reactionMessages: [],
    toneTags: [],
    ...output,
  };
}

describe('sanitizeRealizeOutput', () => {
  it('passes through valid output unchanged', () => {
    const result = sanitizeRealizeOutput(
      build({
        selectedBeatId: 'evt-vp-data-reaction',
        reactionMessages: [
          {
            id: 'react-data-surface-default',
            from: 'the-data-analyst',
            delay: 1500,
            content: 'Thanks.',
          },
        ],
      }),
      {
        matchedChoice: MATCHED_CHOICE,
        stakeholders: STAKEHOLDERS,
        allowedBeatIds: ['evt-vp-data-reaction', 'react-data-surface-default'],
      }
    );
    expect(result.violations).toEqual([]);
    expect(result.output.reactionMessages).toHaveLength(1);
    expect(result.output.selectedBeatId).toBe('evt-vp-data-reaction');
  });

  it('drops a selectedBeatId not in allowedBeatIds', () => {
    const result = sanitizeRealizeOutput(
      build({
        selectedBeatId: 'evt-some-other-event',
      }),
      {
        matchedChoice: MATCHED_CHOICE,
        stakeholders: STAKEHOLDERS,
        allowedBeatIds: ['evt-vp-data-reaction'],
      }
    );
    expect(result.output.selectedBeatId).toBeNull();
    expect(result.violations.join(' ')).toContain('selectedBeatId');
  });

  it('drops reactions with unknown senders so the AI cannot promote new stakeholders', () => {
    const result = sanitizeRealizeOutput(
      build({
        reactionMessages: [
          {
            id: 'ai-react-1',
            from: 'the-ceo',
            delay: 0,
            content: 'I am a phantom stakeholder.',
          },
        ],
      }),
      {
        matchedChoice: MATCHED_CHOICE,
        stakeholders: STAKEHOLDERS,
        allowedBeatIds: [],
      }
    );
    expect(result.output.reactionMessages).toEqual([]);
    expect(result.violations.join(' ')).toContain('not a known stakeholder');
  });

  it('drops reactions using authored ids that do not belong to the matched choice', () => {
    const result = sanitizeRealizeOutput(
      build({
        reactionMessages: [
          {
            id: 'msg-mgr-heads-up',
            from: 'the-manager',
            content: 'Heads up: Sarah was not thrilled.',
            delay: 0,
          },
        ],
      }),
      {
        matchedChoice: MATCHED_CHOICE,
        stakeholders: STAKEHOLDERS,
        allowedBeatIds: ['evt-vp-data-reaction'],
      }
    );
    expect(result.output.reactionMessages).toEqual([]);
    expect(result.violations.join(' ')).toContain('msg-mgr-heads-up');
  });

  it('accepts AI-prefixed reaction ids from a real stakeholder', () => {
    const result = sanitizeRealizeOutput(
      build({
        reactionMessages: [
          {
            id: 'ai-react-vp-1',
            from: 'the-vp',
            delay: 0,
            content: 'Noted.',
          },
        ],
      }),
      {
        matchedChoice: MATCHED_CHOICE,
        stakeholders: STAKEHOLDERS,
        allowedBeatIds: [],
      }
    );
    expect(result.output.reactionMessages).toHaveLength(1);
    expect(result.violations).toEqual([]);
  });

  it('drops overlong reactions that look like fabricated multi-line content', () => {
    const huge = 'x'.repeat(400);
    const result = sanitizeRealizeOutput(
      build({
        reactionMessages: [
          {
            id: 'ai-react-vp-2',
            from: 'the-vp',
            delay: 0,
            content: huge,
          },
        ],
      }),
      {
        matchedChoice: MATCHED_CHOICE,
        stakeholders: STAKEHOLDERS,
        allowedBeatIds: [],
      }
    );
    expect(result.output.reactionMessages).toEqual([]);
    expect(result.violations.join(' ')).toContain('exceeds');
  });
});
