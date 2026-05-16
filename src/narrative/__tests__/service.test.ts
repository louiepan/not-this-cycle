import { describe, expect, it } from 'vitest';
import type { ProviderAdapter, StructuredRunRequest } from '../provider';
import { NarrativeService } from '../service';
import type {
  NarrativeAnalyzeOutput,
  NarrativeRealizeOutput,
  NarrativeReviewRequest,
  NarrativeTurnRequest,
  TaskRunResult,
} from '../types';
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
    voiceRegister: 'Terse imperatives.',
    voiceExamples: ['Need this by EOD.'],
    pushBackLines: ['Specifically?'],
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

function makeRunResult<T>(parsed: T): TaskRunResult<T> {
  return {
    parsed,
    rawText: JSON.stringify(parsed),
    usage: {
      inputTokens: 100,
      outputTokens: 50,
      cachedInputTokens: 0,
      reasoningTokens: 0,
      totalTokens: 150,
    },
    latencyMs: 10,
    estimatedCostUsd: 0.001,
    cache: { hit: false },
    providerResponseId: 'resp-1',
    warnings: [],
    providerId: 'openai',
    modelId: 'gpt-5-mini',
    snapshot: 'test',
  };
}

interface ScriptedOutputs {
  analyze: NarrativeAnalyzeOutput;
  realize: NarrativeRealizeOutput;
}

function makeScriptedProvider(outputs: ScriptedOutputs): ProviderAdapter {
  return {
    id: 'openai',
    isConfigured: () => true,
    capabilities: () => [],
    healthCheck: async () => ({ ok: true, providerId: 'openai' }),
    estimateCost: () => 0,
    runStructured: async <T,>(req: StructuredRunRequest<T>): Promise<TaskRunResult<T>> => {
      const key = req.schemaName;
      if (key === 'NarrativeAnalyzeOutput') {
        return makeRunResult(outputs.analyze) as TaskRunResult<T>;
      }
      if (key === 'NarrativeRealizeOutput') {
        return makeRunResult(outputs.realize) as TaskRunResult<T>;
      }
      throw new Error(`No scripted output for schema ${key}`);
    },
    runText: async () => {
      throw new Error('not implemented');
    },
  };
}

describe('NarrativeService realize guardrails', () => {
  it('filters drifty reactions that reference out-of-scope authored beats', async () => {
    const provider = makeScriptedProvider({
      analyze: {
        matchedChoiceId: 'commit',
        confidence: 0.9,
        tone: 'committing',
        signals: ['ownership'],
        addressedStakeholderIds: ['the-vp'],
        memoryPatch: {},
        contradictionFlags: [],
        complexityScore: 1,
      },
      realize: {
        selectedBeatId: 'evt-vp-data-reaction',
        reactionMessages: [
          {
            id: 'msg-mgr-heads-up',
            from: 'the-manager',
            content: 'Heads up: Sarah was not thrilled.',
            delay: 0,
          },
          {
            id: 'ai-react-valid',
            from: 'the-vp',
            content: 'Noted.',
            delay: 0,
          },
        ],
        toneTags: [],
      },
    });

    const service = new NarrativeService({ openai: provider });
    const response = await service.runTurn(createTurnRequest({ allowedBeatIds: [] }));

    expect(response.reactionMessages.map((reaction) => reaction.id)).toEqual(['ai-react-valid']);
    expect(response.fallbackUsed).toBe(true);
    expect(response.fallbackReason).toContain('Realize guardrail');
  });

  it('keeps clean output untouched', async () => {
    const provider = makeScriptedProvider({
      analyze: {
        matchedChoiceId: 'commit',
        confidence: 0.95,
        tone: 'committing',
        signals: ['ownership'],
        addressedStakeholderIds: ['the-vp'],
        memoryPatch: {},
        contradictionFlags: [],
        complexityScore: 1,
      },
      realize: {
        selectedBeatId: null,
        reactionMessages: [
          {
            id: 'ai-react-vp-1',
            from: 'the-vp',
            content: 'Good. Send me the one-pager by EOD.',
            delay: 1500,
          },
        ],
        toneTags: ['firm'],
      },
    });

    const service = new NarrativeService({ openai: provider });
    const response = await service.runTurn(createTurnRequest({ allowedBeatIds: [] }));

    expect(response.reactionMessages).toHaveLength(1);
    expect(response.fallbackUsed).toBe(false);
  });
});
