import { describe, it, expect } from 'vitest';
import { buildTranscript } from '../buildTranscript';
import type {
  Decision,
  GameState,
  RatingResult,
  ResolvedDecision,
  ScenarioWorld,
  Stakeholder,
} from '@/engine/types';

const STUB_WORLD: ScenarioWorld = {
  templateId: 'test',
  companyName: 'TestCo',
  teamName: 'Test',
  predecessorContext: 'gone',
  hqAddress: 'somewhere',
  productDescription: 'product',
  stage: 'series A',
  annualThemes: [],
  boardPressure: '',
  teamCharter: '',
  mandate: '',
  successCriteria: [],
  successCriteriaFooter: '',
};

const STUB_RATING: RatingResult = {
  compositeScore: 50,
  variables: {
    execTrust: 50,
    communicationEffectiveness: 50,
    teamMorale: 50,
    productJudgment: 50,
    techDebt: 30,
    responsivenessDebt: 10,
  },
  calibrationBucket: 'partially_meets',
  archetype: 'the_survivor',
  conviction: { score: 1, deferCount: 0, contradictionCount: 0 },
  managerReview: 'fine',
  peerFeedback: [],
  calibrationOutcome: 'fine',
};

function makeState(resolvedDecisions: ResolvedDecision[]): GameState {
  return {
    variables: {
      execTrust: 50,
      communicationEffectiveness: 50,
      teamMorale: 50,
      productJudgment: 50,
      techDebt: 30,
      responsivenessDebt: 10,
    },
    clock: 60000,
    phase: 'review',
    deliveredEvents: [],
    pendingDecisions: [],
    resolvedDecisions,
    messages: [],
    unreadCounts: {},
    mentionCounts: {},
    activeChannel: 'general',
  };
}

const AUTHORED_DECISION: Decision = {
  id: 'dec-test',
  timeout: 5000,
  choices: [
    {
      id: 'choice-a',
      label: 'A',
      message: 'A',
      effects: [],
      tone: 'direct',
    },
  ],
};

describe('buildTranscript', () => {
  it('surfaces eventId/channel/presentedAt from resolved decisions instead of "unknown"', () => {
    const resolved: ResolvedDecision = {
      decisionId: 'dec-test',
      choiceId: 'choice-a',
      resolvedAt: 12000,
      effects: [],
      tags: [],
      wasDefer: false,
      contradicts: null,
      eventId: 'evt-test',
      channel: 'general',
      presentedAt: 5000,
      wasAutoResolved: false,
      pushBackStrikes: 0,
      playerAttempts: [],
      matchSource: 'matched',
      matchConfidence: 0.8,
    };

    const transcript = buildTranscript({
      sessionId: 's1',
      createdAt: new Date().toISOString(),
      durationMs: 60000,
      scenarioId: 'q4',
      seed: 1,
      difficulty: 'senior',
      playerName: 'Lou',
      world: STUB_WORLD,
      stakeholders: [] as Stakeholder[],
      gameState: makeState([resolved]),
      pushBackStrikes: new Map(),
      authoredDecisions: [AUTHORED_DECISION],
      finalRating: STUB_RATING,
    });

    const row = transcript.decisions[0];
    expect(row.eventId).toBe('evt-test');
    expect(row.channel).toBe('general');
    expect(row.presentedAt).toBe(5000);
    expect(row.resolvedAt).toBe(12000);
    expect(row.outcome.matchSource).toBe('matched');
    expect(row.outcome.matchConfidence).toBe(0.8);
  });

  it('exports attempts and matchSource for low-confidence fallback resolutions', () => {
    const resolved: ResolvedDecision = {
      decisionId: 'dec-test',
      choiceId: 'choice-a',
      resolvedAt: 15000,
      effects: [],
      tags: ['low-confidence-fallback'],
      wasDefer: false,
      contradicts: null,
      playerText: 'sure',
      eventId: 'evt-test',
      channel: 'general',
      presentedAt: 5000,
      wasAutoResolved: true,
      pushBackStrikes: 2,
      playerAttempts: [
        { text: 'sure', timestamp: 6000, confidence: 0.05, bestChoiceId: 'choice-a' },
        { text: 'idk', timestamp: 9000, confidence: 0.02, bestChoiceId: 'choice-a' },
      ],
      matchSource: 'low_confidence_fallback',
      matchConfidence: 0.05,
    };

    const transcript = buildTranscript({
      sessionId: 's1',
      createdAt: new Date().toISOString(),
      durationMs: 60000,
      scenarioId: 'q4',
      seed: 1,
      difficulty: 'senior',
      playerName: 'Lou',
      world: STUB_WORLD,
      stakeholders: [],
      gameState: makeState([resolved]),
      pushBackStrikes: new Map([['dec-test', 2]]),
      authoredDecisions: [AUTHORED_DECISION],
      finalRating: STUB_RATING,
    });

    const row = transcript.decisions[0];
    expect(row.outcome.matchSource).toBe('low_confidence_fallback');
    expect(row.outcome.wasAutoResolved).toBe(true);
    expect(row.outcome.pushBackStrikes).toBe(2);
    expect(row.outcome.attempts).toHaveLength(2);
    expect(row.outcome.attempts[0].text).toBe('sure');
    expect(row.outcome.playerText).toBe('sure');
    expect(row.outcome.matchedChoiceId).toBe('choice-a');
  });

  it('exports matchSource=timeout for pure-timeout resolutions', () => {
    const resolved: ResolvedDecision = {
      decisionId: 'dec-test',
      choiceId: null,
      resolvedAt: 15000,
      effects: [],
      tags: ['auto-resolved', 'timeout'],
      wasDefer: false,
      contradicts: null,
      eventId: 'evt-test',
      channel: 'general',
      presentedAt: 5000,
      wasAutoResolved: true,
      pushBackStrikes: 0,
      playerAttempts: [],
      matchSource: 'timeout',
    };

    const transcript = buildTranscript({
      sessionId: 's1',
      createdAt: new Date().toISOString(),
      durationMs: 60000,
      scenarioId: 'q4',
      seed: 1,
      difficulty: 'senior',
      playerName: 'Lou',
      world: STUB_WORLD,
      stakeholders: [],
      gameState: makeState([resolved]),
      pushBackStrikes: new Map(),
      authoredDecisions: [AUTHORED_DECISION],
      finalRating: STUB_RATING,
    });

    const row = transcript.decisions[0];
    expect(row.outcome.matchSource).toBe('timeout');
    expect(row.outcome.wasAutoResolved).toBe(true);
    expect(row.outcome.matchedChoiceId).toBeNull();
    expect(row.outcome.playerText).toBeNull();
    expect(row.outcome.attempts).toEqual([]);
  });
});
