import { describe, it, expect } from 'vitest';
import { RatingEngine } from '../RatingEngine';
import { INITIAL_VARIABLES, type GameVariables, type ResolvedDecision } from '../types';

function makeDecision(overrides: Partial<ResolvedDecision> = {}): ResolvedDecision {
  return {
    decisionId: 'dec-1',
    choiceId: 'choice-1',
    resolvedAt: 1000,
    effects: [],
    tags: [],
    wasDefer: false,
    contradicts: null,
    ...overrides,
  };
}

describe('RatingEngine', () => {
  const engine = new RatingEngine();

  describe('compositeScore', () => {
    it('computes weighted score from defaults', () => {
      const score = engine.computeCompositeScore(INITIAL_VARIABLES);
      // execTrust=50*0.30 + comm=50*0.25 + morale=60*0.15 + judgment=50*0.10
      // + (100-30)*0.10 + (100-0)*0.10
      // = 15 + 12.5 + 9 + 5 + 7 + 10 = 58.5
      expect(score).toBe(58.5);
    });

    it('penalizes high techDebt (inverted)', () => {
      const vars: GameVariables = { ...INITIAL_VARIABLES, techDebt: 80 };
      const score = engine.computeCompositeScore(vars);
      const defaultScore = engine.computeCompositeScore(INITIAL_VARIABLES);
      expect(score).toBeLessThan(defaultScore);
    });
  });

  describe('calibration buckets', () => {
    it('maps scores to correct buckets', () => {
      expect(engine.getBucket(20)).toBe('needs_improvement');
      expect(engine.getBucket(35)).toBe('partially_meets');
      expect(engine.getBucket(55)).toBe('meets_expectations');
      expect(engine.getBucket(75)).toBe('exceeds_expectations');
      expect(engine.getBucket(90)).toBe('strongly_exceeds');
    });
  });

  describe('conviction', () => {
    it('returns 1.0 for clean decisions', () => {
      const decisions = [makeDecision(), makeDecision({ decisionId: 'dec-2' })];
      const result = engine.computeConviction(decisions);
      expect(result.score).toBe(1.0);
      expect(result.deferCount).toBe(0);
      expect(result.contradictionCount).toBe(0);
    });

    it('penalizes defers', () => {
      const decisions = [
        makeDecision({ wasDefer: true }),
        makeDecision({ decisionId: 'dec-2', wasDefer: true }),
      ];
      const result = engine.computeConviction(decisions);
      expect(result.deferCount).toBe(2);
      expect(result.score).toBe(0.8);
    });

    it('penalizes contradictions', () => {
      const decisions = [
        makeDecision({ contradicts: 'prev-choice' }),
      ];
      const result = engine.computeConviction(decisions);
      expect(result.contradictionCount).toBe(1);
      expect(result.score).toBe(0.85);
    });

    it('floors at 0', () => {
      const decisions = Array.from({ length: 20 }, (_, i) =>
        makeDecision({ decisionId: `dec-${i}`, wasDefer: true })
      );
      const result = engine.computeConviction(decisions);
      expect(result.score).toBe(0);
    });
  });

  describe('archetype detection', () => {
    it('detects The Ghost for high responsiveness debt', () => {
      const vars: GameVariables = { ...INITIAL_VARIABLES, responsivenessDebt: 65 };
      const conviction = engine.computeConviction([]);
      expect(engine.detectArchetype(vars, conviction)).toBe('the_ghost');
    });

    it('detects The Politician for high exec trust + low morale', () => {
      const vars: GameVariables = {
        ...INITIAL_VARIABLES,
        execTrust: 80,
        teamMorale: 25,
      };
      const conviction = engine.computeConviction([]);
      expect(engine.detectArchetype(vars, conviction)).toBe('the_politician');
    });

    it('detects The Unicorn when everything is balanced', () => {
      const vars: GameVariables = {
        execTrust: 60,
        communicationEffectiveness: 60,
        teamMorale: 60,
        productJudgment: 60,
        techDebt: 40,
        responsivenessDebt: 10,
      };
      const conviction = engine.computeConviction([]);
      expect(engine.detectArchetype(vars, conviction)).toBe('the_unicorn');
    });

    it('falls back to The Survivor', () => {
      const vars: GameVariables = { ...INITIAL_VARIABLES };
      const conviction = engine.computeConviction([]);
      expect(engine.detectArchetype(vars, conviction)).toBe('the_survivor');
    });
  });
});
