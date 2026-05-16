/**
 * Player profile persistence — localStorage only, SSR-safe.
 *
 * Stores the player's name, last difficulty, and a quiet history of past runs.
 * No backend, no auth, no leaderboard. If the user clears storage, history
 * resets — and that's fine. Nothing about your work here is actually permanent.
 *
 * Schema is versioned (`ntc:player:v1`) so future migrations don't break old data.
 */

import type { Archetype, CalibrationBucket, Difficulty } from '@/engine/types';

const STORAGE_KEY = 'ntc:player:v1';
const MAX_HISTORY = 50; // Cap so localStorage never explodes on power-users.

export interface RunRecord {
  /** Stable identifier; client-generated. */
  id: string;
  /** ISO 8601 timestamp of when the review screen rendered. */
  completedAt: string;
  difficulty: Difficulty;
  archetype: Archetype;
  calibrationBucket: CalibrationBucket;
  scenarioId: string;
}

export interface PlayerProfile {
  schemaVersion: 1;
  playerName: string;
  lastDifficulty: Difficulty | null;
  runHistory: RunRecord[];
}

const EMPTY_PROFILE: PlayerProfile = {
  schemaVersion: 1,
  playerName: '',
  lastDifficulty: null,
  runHistory: [],
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function generateRunId(): string {
  // Crypto-quality not required — this is local-only.
  return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Read the player profile from localStorage. Returns an empty profile on
 * SSR, missing data, or corrupted JSON. Never throws.
 */
export function loadProfile(): PlayerProfile {
  if (!isBrowser()) return EMPTY_PROFILE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROFILE;

    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;

    // Reject unknown schema versions — safer to start fresh than render garbage.
    if (parsed.schemaVersion !== 1) return EMPTY_PROFILE;

    return {
      schemaVersion: 1,
      playerName: typeof parsed.playerName === 'string' ? parsed.playerName : '',
      lastDifficulty: parsed.lastDifficulty ?? null,
      runHistory: Array.isArray(parsed.runHistory) ? parsed.runHistory : [],
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

/**
 * Persist the full profile. Best-effort; failures (quota, private mode) are
 * swallowed because the game must remain playable without storage.
 */
export function saveProfile(profile: PlayerProfile): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Quota exceeded or private mode — ignore.
  }
}

/**
 * Update only the name and (optionally) last difficulty. Preserves runHistory.
 */
export function updateIdentity(playerName: string, lastDifficulty?: Difficulty | null): PlayerProfile {
  const current = loadProfile();
  const next: PlayerProfile = {
    ...current,
    playerName,
    lastDifficulty: lastDifficulty !== undefined ? lastDifficulty : current.lastDifficulty,
  };
  saveProfile(next);
  return next;
}

/**
 * Append a completed run to the history. Returns the updated profile.
 * Auto-generates the run id and timestamp.
 */
export function appendRun(record: Omit<RunRecord, 'id' | 'completedAt'>): PlayerProfile {
  const current = loadProfile();

  const newRun: RunRecord = {
    ...record,
    id: generateRunId(),
    completedAt: new Date().toISOString(),
  };

  const trimmedHistory = [...current.runHistory, newRun].slice(-MAX_HISTORY);

  const next: PlayerProfile = {
    ...current,
    lastDifficulty: record.difficulty,
    runHistory: trimmedHistory,
  };

  saveProfile(next);
  return next;
}

/**
 * Wipe the profile. Used by the "Not [Name]? Start fresh" link.
 */
export function clearProfile(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

/**
 * Convenience: most recent N runs (newest first).
 */
export function recentRuns(profile: PlayerProfile, limit: number): RunRecord[] {
  return [...profile.runHistory].reverse().slice(0, limit);
}
