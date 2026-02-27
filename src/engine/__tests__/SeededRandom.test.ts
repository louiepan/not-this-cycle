import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../SeededRandom';

describe('SeededRandom', () => {
  it('produces deterministic sequences', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    const valuesA = Array.from({ length: 10 }, () => a.next());
    const valuesB = Array.from({ length: 10 }, () => b.next());
    expect(valuesA).toEqual(valuesB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(99);
    const valuesA = Array.from({ length: 10 }, () => a.next());
    const valuesB = Array.from({ length: 10 }, () => b.next());
    expect(valuesA).not.toEqual(valuesB);
  });

  it('generates values in [0, 1)', () => {
    const rng = new SeededRandom(12345);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int() returns values in range', () => {
    const rng = new SeededRandom(99);
    for (let i = 0; i < 100; i++) {
      const v = rng.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });

  it('pick() returns elements from array', () => {
    const rng = new SeededRandom(42);
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 20; i++) {
      expect(items).toContain(rng.pick(items));
    }
  });

  it('shuffle() produces deterministic permutations', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    const arr = [1, 2, 3, 4, 5];
    expect(a.shuffle(arr)).toEqual(b.shuffle(arr));
  });
});
