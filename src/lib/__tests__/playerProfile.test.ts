import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';

// Stub a minimal `window.localStorage` since vitest runs in the node env
// and the module under test reads from `window`.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const globalRef = globalThis as unknown as { window?: { localStorage: MemoryStorage } };
const originalWindow = globalRef.window;

beforeAll(() => {
  globalRef.window = { localStorage: new MemoryStorage() };
});

afterAll(() => {
  if (originalWindow === undefined) {
    delete globalRef.window;
  } else {
    globalRef.window = originalWindow;
  }
});

beforeEach(() => {
  window.localStorage.clear();
});

// Import AFTER window is stubbed.
const {
  loadProfile,
  saveProfile,
  appendRun,
  clearProfile,
  recentRuns,
} = await import('../playerProfile');

describe('playerProfile', () => {
  describe('loadProfile', () => {
    it('returns an empty profile when storage is empty', () => {
      const profile = loadProfile();
      expect(profile.lastDifficulty).toBeNull();
      expect(profile.runHistory).toEqual([]);
    });

    it('returns an empty profile when storage contains garbage', () => {
      window.localStorage.setItem('ntc:player:v1', '{not json');
      const profile = loadProfile();
      expect(profile.runHistory).toEqual([]);
    });

    it('rejects unknown schema versions', () => {
      window.localStorage.setItem(
        'ntc:player:v1',
        JSON.stringify({ schemaVersion: 99, lastDifficulty: 'junior' })
      );
      const profile = loadProfile();
      expect(profile.lastDifficulty).toBeNull();
    });
  });

  describe('saveProfile + loadProfile round-trip', () => {
    it('preserves all fields', () => {
      saveProfile({
        schemaVersion: 1,
        lastDifficulty: 'senior',
        runHistory: [],
      });
      const profile = loadProfile();
      expect(profile.lastDifficulty).toBe('senior');
    });
  });

  describe('appendRun', () => {
    it('adds a run with auto id and timestamp', () => {
      const profile = appendRun({
        difficulty: 'senior',
        archetype: 'the_diplomat',
        calibrationBucket: 'meets_expectations',
        scenarioId: 'q4-planning',
      });
      expect(profile.runHistory).toHaveLength(1);
      expect(profile.runHistory[0].id).toMatch(/^run_/);
      expect(profile.runHistory[0].completedAt).toMatch(/T/);
    });

    it('updates lastDifficulty to the appended run', () => {
      const profile = appendRun({
        difficulty: 'principal',
        archetype: 'the_unicorn',
        calibrationBucket: 'strongly_exceeds',
        scenarioId: 'q4-planning',
      });
      expect(profile.lastDifficulty).toBe('principal');
    });

    it('caps history at 50 entries', () => {
      let profile;
      for (let i = 0; i < 55; i++) {
        profile = appendRun({
          difficulty: 'junior',
          archetype: 'the_ghost',
          calibrationBucket: 'partially_meets',
          scenarioId: 'q4-planning',
        });
      }
      expect(profile!.runHistory).toHaveLength(50);
    });
  });

  describe('clearProfile', () => {
    it('wipes storage', () => {
      appendRun({
        difficulty: 'junior',
        archetype: 'the_ghost',
        calibrationBucket: 'needs_improvement',
        scenarioId: 'q4-planning',
      });
      clearProfile();
      expect(loadProfile().runHistory).toEqual([]);
    });
  });

  describe('recentRuns', () => {
    it('returns newest first, limited', () => {
      appendRun({
        difficulty: 'junior',
        archetype: 'the_ghost',
        calibrationBucket: 'needs_improvement',
        scenarioId: 'q4-planning',
      });
      appendRun({
        difficulty: 'senior',
        archetype: 'the_diplomat',
        calibrationBucket: 'exceeds_expectations',
        scenarioId: 'q4-planning',
      });
      const recent = recentRuns(loadProfile(), 1);
      expect(recent).toHaveLength(1);
      expect(recent[0].archetype).toBe('the_diplomat');
    });
  });
});
