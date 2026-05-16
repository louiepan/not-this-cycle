import { describe, it, expect } from 'vitest';
import { selectContinuityLines } from '../continuityLines';
import type { RunRecord } from '@/lib/playerProfile';
import type { Archetype, CalibrationBucket, Difficulty } from '@/engine/types';

function makeRun(
  index: number,
  overrides: Partial<RunRecord> = {}
): RunRecord {
  return {
    id: `run_${index}`,
    completedAt: new Date(2026, 0, index + 1).toISOString(),
    difficulty: 'senior' as Difficulty,
    archetype: 'the_diplomat' as Archetype,
    calibrationBucket: 'meets_expectations' as CalibrationBucket,
    scenarioId: 'q4-planning',
    ...overrides,
  };
}

describe('selectContinuityLines', () => {
  const baseCurrent = {
    archetype: 'the_diplomat' as Archetype,
    calibrationBucket: 'meets_expectations' as CalibrationBucket,
    difficulty: 'senior' as Difficulty,
  };

  it('emits no lines on the first ever run', () => {
    const lines = selectContinuityLines({
      history: [],
      current: baseCurrent,
      playerName: 'Louis',
      companyName: 'TechCorp',
    });
    expect(lines).toHaveLength(0);
  });

  it('emits a welcome-back line on the second run, using the company name', () => {
    const lines = selectContinuityLines({
      history: [makeRun(0)],
      current: baseCurrent,
      playerName: 'Louis',
      companyName: 'Globex',
    });
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toContain('second performance review');
    expect(lines[0]).toContain('Louis');
    expect(lines[0]).toContain('Globex');
  });

  it('emits a frequent-flyer line at 5+ runs', () => {
    const history = Array.from({ length: 4 }, (_, i) =>
      makeRun(i, { archetype: 'the_ghost' as Archetype, calibrationBucket: 'partially_meets' as CalibrationBucket })
    );
    const lines = selectContinuityLines({
      history,
      current: baseCurrent,
      playerName: 'Louis',
      companyName: 'TechCorp',
    });
    expect(lines.some((line) => line.includes('5th'))).toBe(true);
  });

  it('flags a 3x bucket streak', () => {
    const history = [
      makeRun(0, { calibrationBucket: 'needs_improvement' }),
      makeRun(1, { calibrationBucket: 'needs_improvement' }),
    ];
    const lines = selectContinuityLines({
      history,
      current: { ...baseCurrent, calibrationBucket: 'needs_improvement' },
      playerName: 'Louis',
      companyName: 'TechCorp',
    });
    expect(lines.some((l) => l.includes('three cycles in a row'))).toBe(true);
  });

  it('escalates language at 4+ bucket streak', () => {
    const history = Array.from({ length: 3 }, (_, i) =>
      makeRun(i, { calibrationBucket: 'partially_meets' })
    );
    const lines = selectContinuityLines({
      history,
      current: { ...baseCurrent, calibrationBucket: 'partially_meets' },
      playerName: 'Louis',
      companyName: 'TechCorp',
    });
    expect(lines.some((l) => l.includes('documenting it for legal'))).toBe(true);
  });

  it('detects "never exceeded" across long history', () => {
    const history = Array.from({ length: 3 }, (_, i) =>
      makeRun(i, {
        calibrationBucket: i % 2 === 0 ? 'partially_meets' : 'meets_expectations',
      })
    );
    const lines = selectContinuityLines({
      history,
      current: baseCurrent, // meets_expectations
      playerName: 'Louis',
      companyName: 'TechCorp',
    });
    expect(lines.some((l) => l.includes('never exceeded expectations'))).toBe(true);
  });

  it('detects archetype drift', () => {
    const history = [makeRun(0, { archetype: 'the_cassandra' })];
    const lines = selectContinuityLines({
      history,
      current: { ...baseCurrent, archetype: 'the_bulldozer' },
      playerName: 'Louis',
      companyName: 'TechCorp',
    });
    expect(lines.some((l) => l.includes('Last cycle you were'))).toBe(true);
  });

  it('detects 3x same archetype', () => {
    const history = [
      makeRun(0, { archetype: 'the_ghost' }),
      makeRun(1, { archetype: 'the_ghost' }),
    ];
    const lines = selectContinuityLines({
      history,
      current: { ...baseCurrent, archetype: 'the_ghost' },
      playerName: 'Louis',
      companyName: 'TechCorp',
    });
    expect(lines.some((l) => l.includes('At some point, this becomes who you are'))).toBe(true);
  });

  it('caps output at 2 lines', () => {
    const history = Array.from({ length: 4 }, (_, i) =>
      makeRun(i, { calibrationBucket: 'needs_improvement', archetype: 'the_ghost' })
    );
    const lines = selectContinuityLines({
      history,
      current: {
        archetype: 'the_ghost',
        calibrationBucket: 'needs_improvement',
        difficulty: 'principal',
      },
      playerName: 'Louis',
      companyName: 'TechCorp',
    });
    expect(lines.length).toBeLessThanOrEqual(2);
  });

  it('does not emit two lines from the same category', () => {
    const history = Array.from({ length: 3 }, (_, i) =>
      makeRun(i, { calibrationBucket: 'partially_meets' })
    );
    const lines = selectContinuityLines({
      history,
      current: { ...baseCurrent, calibrationBucket: 'partially_meets' },
      playerName: 'Louis',
      companyName: 'TechCorp',
    });
    const bucketLines = lines.filter(
      (l) =>
        l.includes('cycles in a row') ||
        l.includes('documenting it for legal') ||
        l.includes('never exceeded')
    );
    expect(bucketLines.length).toBeLessThanOrEqual(1);
  });

  it('falls back to "you" when playerName is empty', () => {
    const lines = selectContinuityLines({
      history: [makeRun(0)],
      current: baseCurrent,
      playerName: '',
      companyName: 'TechCorp',
    });
    expect(lines[0]).toContain('you');
  });

  it('falls back to "the company" when companyName is empty', () => {
    const lines = selectContinuityLines({
      history: [makeRun(0)],
      current: baseCurrent,
      playerName: 'Louis',
      companyName: '',
    });
    expect(lines[0]).toContain('the company');
  });

  it('handles difficulty escalation', () => {
    const history = [makeRun(0, { difficulty: 'junior' })];
    const lines = selectContinuityLines({
      history,
      current: { ...baseCurrent, difficulty: 'principal' },
      playerName: 'Louis',
      companyName: 'TechCorp',
    });
    expect(lines.some((l) => l.includes('leveled up'))).toBe(true);
  });
});
