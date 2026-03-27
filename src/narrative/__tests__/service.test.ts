import { describe, expect, it } from 'vitest';
import type { ProviderAdapter } from '../provider';
import { NarrativeService } from '../service';
import type { NarrativeReviewRequest, NarrativeTurnRequest } from '../types';
import type { Stakeholder } from '@/engine/types';

const TEST_STAKEHOLDER: Stakeholder = {
  id: 'the-vp',
  name: 'Alex Chen',
  role: 'VP Product',
  seniority: 'vp',
  statusEmoji: '🎯',
  statusText: 'In meetings',
  personality: {
    mbtiType: 'ENTJ',
    enneagramType: 3,
    enneagramWing: 2,
    stressDirection: 9,
    coreFear: 'Looking indecisive',
    coreDesire: 'Winning',
    communicationStyle: 'direct',
  },
  mechanics: {
    patience: 0.2,
    directness: 0.9,
    conflictStyle: 'confront',
    politicalAwareness: 0.9,
    escalationPattern: 'go-public',
  },
};

const DISABLED_PROVIDER: ProviderAdapter = {
  id: 'openai',
  isConfigured: () => false,
  capabilities: () => [],
  healthCheck: async () => ({ ok: false, providerId: 'openai' }),
  estimateCost: () => 0,
  runStructured: async () => {
    throw new Error('disabled');
  },
  runText: async () => {
    throw new Error('disabled');
  },
};

function createTurnRequest(overrides: Partial<NarrativeTurnRequest> = {}): NarrativeTurnRequest {
  return {
    sessionId: 'session-1',
    scenarioId: 'q4-planning',
    seed: 42,
    difficulty: 'senior',
    playerText: 'yes',
    stakeholders: [TEST_STAKEHOLDER],
    messages: [
      {
        id: 'msg-1',
        eventId: 'evt-1',
        channel: 'product',
        from: 'the-vp',
        content: 'Can you commit to this?',
        timestamp: 1000,
        mentionsPlayer: true,
        contextValue: null,
        isPlayerMessage: false,
      },
    ],
    decision: {
      decisionId: 'dec-1',
      eventId: 'evt-1',
      channelId: 'product',
      presentedAt: 1200,
      timeout: 20000,
      escalationStage: 0,
      choices: [
        {
          id: 'commit',
          label: 'Commit',
          message: 'Yes, I will own it.',
          effects: [{ variable: 'execTrust', delta: 5, tag: 'commit' }],
          tone: 'committing',
        },
        {
          id: 'defer',
          label: 'Defer',
          message: 'Let me think.',
          effects: [{ variable: 'execTrust', delta: -5, tag: 'defer' }],
          tone: 'deflecting',
          isDefer: true,
        },
      ],
    },
    engineSnapshot: {
      variables: {
        execTrust: 50,
        communicationEffectiveness: 50,
        teamMorale: 50,
        productJudgment: 50,
        techDebt: 30,
        responsivenessDebt: 0,
      },
      resolvedDecisions: [],
      pendingDecisions: [],
      clock: 1500,
    },
    allowedBeatIds: [],
    fallbackPlan: ['heuristic_matcher', 'authored_reactions'],
    ...overrides,
  };
}

function createReviewRequest(): NarrativeReviewRequest {
  return {
    sessionId: 'session-1',
    scenarioId: 'q4-planning',
    stakeholders: [TEST_STAKEHOLDER],
    ratingResult: {
      compositeScore: 72,
      variables: {
        execTrust: 65,
        communicationEffectiveness: 64,
        teamMorale: 58,
        productJudgment: 54,
        techDebt: 38,
        responsivenessDebt: 12,
      },
      calibrationBucket: 'meets_expectations',
      archetype: 'the_survivor',
      conviction: {
        score: 0.8,
        deferCount: 1,
        contradictionCount: 0,
      },
      managerReview: 'Existing manager review',
      peerFeedback: [],
      calibrationOutcome: 'Existing outcome',
    },
  };
}

describe('NarrativeService fallback behavior', () => {
  it('falls back to the heuristic turn path when providers are unavailable', async () => {
    const service = new NarrativeService({ openai: DISABLED_PROVIDER });

    const response = await service.runTurn(createTurnRequest());

    expect(response.fallbackUsed).toBe(true);
    expect(response.matchedChoiceId).toBe('commit');
    expect(response.analysis.matchedTone).toBe('committing');
  });

  it('requests a nudge on low-confidence fallback matches', async () => {
    const service = new NarrativeService({ openai: DISABLED_PROVIDER });

    const response = await service.runTurn(
      createTurnRequest({
        playerText: 'purple banana',
      })
    );

    expect(response.fallbackUsed).toBe(true);
    expect(response.matchedChoiceId).toBeNull();
    expect(response.nudgeMessage).toContain('Could you say more?');
  });

  it('falls back to deterministic review content when providers are unavailable', async () => {
    const service = new NarrativeService({ openai: DISABLED_PROVIDER });

    const response = await service.runReview(createReviewRequest());

    expect(response.fallbackUsed).toBe(true);
    expect(response.managerReview).toBe('Existing manager review');
    expect(response.peerFeedback.length).toBeGreaterThan(0);
  });
});
