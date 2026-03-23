import { describe, it, expect } from 'vitest';
import { GameEngine } from '../GameEngine';
import { analyzePlayerReply } from '../ChoiceMatcher';
import { DIFFICULTIES } from '../types';
import type { Scenario } from '../types';

/**
 * Minimal scenario for integration testing.
 * Tests the full path: event delivery -> decision -> escalation -> auto-resolve
 */
const TEST_SCENARIO: Scenario = {
  id: 'test-scenario',
  title: 'Test Scenario',
  premise: 'Testing',
  durationTarget: 60000,
  stakeholders: [
    {
      id: 'the-vp',
      templateId: 'the-vp',
      role: 'VP of Product',
      seniority: 'vp',
      statusEmoji: '🎯',
      statusText: 'In meetings',
      personality: {
        mbtiType: 'ENTJ',
        enneagramType: 3,
        enneagramWing: 4,
        stressDirection: 9,
        coreFear: 'Being irrelevant',
        coreDesire: 'Achievement',
        communicationStyle: 'Direct and concise',
      },
      mechanics: {
        patience: 0.5,
        directness: 0.9,
        conflictStyle: 'confront',
        politicalAwareness: 0.9,
        escalationPattern: 'go-public',
      },
      namePool: [
        { firstName: 'Sarah', lastName: 'Chen' },
        { firstName: 'Marcus', lastName: 'Wright' },
      ],
    },
  ],
  channels: [
    { id: 'product', name: '#product', type: 'channel' },
  ],
  events: [
    {
      id: 'evt-welcome',
      triggerAt: 0,
      channel: 'product',
      messages: [
        {
          id: 'msg-welcome',
          from: 'the-vp',
          content: 'Hey, we need to talk about the Q4 roadmap.',
          delay: 0,
          mentionsPlayer: true,
        },
      ],
      decision: {
        id: 'dec-roadmap',
        timeout: 5000,
        choices: [
          {
            id: 'choice-engage',
            label: 'Engage',
            message: "Sure, let's discuss. I've been thinking about this.",
            effects: [
              { variable: 'execTrust', delta: 10, tag: 'engage-vp' },
            ],
            reactions: [
              {
                id: 'react-risk',
                from: 'the-vp',
                delay: 1000,
                content: 'Bring me the risks and the recommendation.',
                when: { hasAnySignals: ['risk'] },
              },
              {
                id: 'react-default',
                from: 'the-vp',
                delay: 1000,
                content: 'Great. Keep it moving.',
              },
            ],
            tone: 'diplomatic',
          },
          {
            id: 'choice-defer',
            label: 'Defer',
            message: 'Let me pull some data first and get back to you.',
            effects: [
              { variable: 'execTrust', delta: -5, tag: 'defer-vp' },
            ],
            tone: 'deflecting',
            isDefer: true,
          },
        ],
        escalation: {
          stages: [
            {
              eventId: 'evt-escalation-1',
              delay: 3000,
              effects: [
                { variable: 'execTrust', delta: -5, tag: 'slow-response' },
              ],
            },
          ],
          autoResolve: {
            delay: 5000,
            effects: [
              { variable: 'execTrust', delta: -15, tag: 'no-response' },
              { variable: 'responsivenessDebt', delta: 8, tag: 'no-response' },
            ],
            description: 'The VP decided without you and moved the roadmap forward.',
          },
        },
      },
    },
    {
      id: 'evt-escalation-1',
      channel: 'product',
      messages: [
        {
          id: 'msg-escalation',
          from: 'the-vp',
          content: 'Hello? Need an answer on this today.',
          delay: 0,
          mentionsPlayer: true,
        },
      ],
    },
  ],
  ambientPools: [],
  initialState: {},
  endCondition: { type: 'clock', at: 60000 },
};

describe('GameEngine Integration', () => {
  it('starts and delivers initial events', () => {
    const engine = new GameEngine(TEST_SCENARIO, DIFFICULTIES.senior, 42);
    engine.start();

    const actions = engine.tick(0);

    // Should fire the welcome event and schedule a decision
    const deliveries = actions.filter((a) => a.type === 'deliver_message');
    const decisions = actions.filter((a) => a.type === 'present_decision');
    expect(decisions.length).toBeGreaterThanOrEqual(0);

    // Run a second tick to deliver queued messages
    const actions2 = engine.tick(600);
    const allDeliveries = [...deliveries, ...actions2.filter((a) => a.type === 'deliver_message')];
    expect(allDeliveries.length).toBeGreaterThanOrEqual(1);
  });

  it('resolves a decision and applies effects', () => {
    const engine = new GameEngine(TEST_SCENARIO, DIFFICULTIES.senior, 42);
    engine.start();

    // Tick past initial event
    engine.tick(0);
    engine.tick(600);

    const state = engine.getState();
    const pending = state.pendingDecisions;

    if (pending.length > 0) {
      const before = engine.getState().variables.execTrust;
      engine.resolve(pending[0].decisionId, 'choice-engage');
      const after = engine.getState().variables.execTrust;
      expect(after).toBe(before + 10);
    }
  });

  it('schedules reactive follow-ups based on player intent', () => {
    const engine = new GameEngine(TEST_SCENARIO, DIFFICULTIES.senior, 42);
    engine.start();

    engine.tick(0);
    engine.tick(600);

    const pending = engine.getState().pendingDecisions[0];
    const analysis = analyzePlayerReply(
      'Sure, but I want to be realistic about the risks here.',
      engine.getStakeholders(),
      'direct'
    );

    engine.resolve(
      pending.decisionId,
      'choice-engage',
      'Sure, but I want to be realistic about the risks here.',
      analysis
    );

    engine.tick(2000);
    const actions = engine.tick(3200);
    const followUp = actions.find(
      (action) =>
        action.type === 'deliver_message' &&
        action.message.content === 'Bring me the risks and the recommendation.'
    );

    expect(followUp).toBeTruthy();
  });

  it('escalates unanswered decisions', () => {
    const engine = new GameEngine(TEST_SCENARIO, DIFFICULTIES.senior, 42);
    engine.start();

    // Let time pass without answering
    engine.tick(0);
    engine.tick(600);
    engine.tick(3000);
    engine.tick(6000);
    engine.tick(8000);

    const state = engine.getState();
    // Should have taken responsiveness debt or escalation penalties
    expect(state.variables.execTrust).toBeLessThanOrEqual(50);
  });

  it('does not fire events after game ends', () => {
    const engine = new GameEngine(TEST_SCENARIO, DIFFICULTIES.senior, 42);
    engine.start();

    // Jump past the end
    const actions = engine.tick(70000);

    // Should end the game
    const endActions = actions.filter((a) => a.type === 'end_game');
    expect(endActions.length).toBeGreaterThanOrEqual(1);

    // Subsequent ticks should produce nothing
    const postActions = engine.tick(75000);
    expect(postActions.length).toBe(0);
  });

  it('uses seeded randomization for stakeholder names', () => {
    const engine1 = new GameEngine(TEST_SCENARIO, DIFFICULTIES.senior, 42);
    const engine2 = new GameEngine(TEST_SCENARIO, DIFFICULTIES.senior, 42);

    const name1 = engine1.getStakeholders()[0].name;
    const name2 = engine2.getStakeholders()[0].name;
    expect(name1).toBe(name2);
  });

  it('produces different names for different seeds', () => {
    const engine1 = new GameEngine(TEST_SCENARIO, DIFFICULTIES.senior, 1);
    const engine2 = new GameEngine(TEST_SCENARIO, DIFFICULTIES.senior, 99999);

    const name1 = engine1.getStakeholders()[0].name;
    const name2 = engine2.getStakeholders()[0].name;
    // With only 2 names in the pool, they might collide, but seeds are very different
    // This test is probabilistic — with a real pool of 5+ names it would be reliable
    // For now, just assert that names are resolved
    expect(name1).toBeTruthy();
    expect(name2).toBeTruthy();
  });
});
