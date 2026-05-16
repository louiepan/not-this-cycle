/**
 * Satirical continuity lines for ReviewScreen.
 *
 * Reads the player's run history and emits 0–2 lines of dry corporate
 * commentary that reference prior reviews. The product gem is here:
 * the satire sharpens when the game remembers you across cycles.
 *
 * Pure module. No React, no localStorage. Takes data in, returns strings out.
 * Engine stays untouched.
 */

import { RatingEngine } from '@/engine/RatingEngine';
import type { Archetype, CalibrationBucket, Difficulty } from '@/engine/types';
import type { RunRecord } from '@/lib/playerProfile';

export interface ContinuitySelectionInput {
  /** Past runs only — do NOT include the current run. Newest run is last. */
  history: RunRecord[];
  current: {
    archetype: Archetype;
    calibrationBucket: CalibrationBucket;
    difficulty: Difficulty;
  };
  playerName: string;
}

interface CandidateLine {
  /** Higher tier = more specific, more satirically loaded. */
  tier: 1 | 2 | 3 | 4;
  text: string;
  /** A category so we don't emit two lines with the same theme. */
  category: 'cadence' | 'bucket' | 'archetype' | 'difficulty';
}

const BUCKETS_BELOW_OR_AT_MIDLINE: readonly CalibrationBucket[] = [
  'needs_improvement',
  'partially_meets',
  'meets_expectations',
];

const BUCKET_PHRASES: Record<CalibrationBucket, string> = {
  needs_improvement: 'Needs Improvement',
  partially_meets: 'Partially Meets',
  meets_expectations: 'Meets Most Expectations',
  exceeds_expectations: 'Exceeds Expectations',
  strongly_exceeds: 'Strongly Exceeds',
};

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function archetypeName(archetype: Archetype): string {
  return RatingEngine.ARCHETYPE_LABELS[archetype]?.name ?? 'The Survivor';
}

/**
 * Build all applicable candidate lines, then pick the strongest 1-2.
 * Caller renders them in order.
 */
export function selectContinuityLines(input: ContinuitySelectionInput): string[] {
  const { history, current, playerName } = input;
  const totalReviews = history.length + 1; // include current
  if (totalReviews < 2) return [];

  const candidates: CandidateLine[] = [];
  const nameOrYou = playerName.trim() || 'you';

  // --- CADENCE rules (mentions of total review count) ---

  if (totalReviews === 2) {
    candidates.push({
      tier: 4,
      category: 'cadence',
      text: `Welcome back, ${nameOrYou}. This is your second performance review at TechCorp. We appreciate your commitment to the process.`,
    });
  } else if (totalReviews >= 5) {
    candidates.push({
      tier: 3,
      category: 'cadence',
      text: `This is your ${ordinal(totalReviews)} performance review at TechCorp. Several team members have asked HR if you are okay.`,
    });
  } else if (totalReviews >= 3) {
    candidates.push({
      tier: 4,
      category: 'cadence',
      text: `This is your ${ordinal(totalReviews)} performance review at TechCorp. The pattern has not gone unnoticed.`,
    });
  }

  // --- BUCKET rules (rating-streak commentary) ---

  const allBuckets = [...history.map((r) => r.calibrationBucket), current.calibrationBucket];
  const trailingBucketRun = countTrailingSame(allBuckets);

  if (trailingBucketRun >= 4) {
    candidates.push({
      tier: 1,
      category: 'bucket',
      text: `You have now received "${BUCKET_PHRASES[current.calibrationBucket]}" in ${trailingBucketRun} consecutive reviews. At this point we are simply documenting it for legal.`,
    });
  } else if (trailingBucketRun === 3) {
    candidates.push({
      tier: 2,
      category: 'bucket',
      text: `You have received "${BUCKET_PHRASES[current.calibrationBucket]}" three cycles in a row. The pattern has been noted in your file.`,
    });
  }

  // Never exceeded expectations (long history at or below midline).
  const allAtOrBelowMidline = allBuckets.every((b) => BUCKETS_BELOW_OR_AT_MIDLINE.includes(b));
  if (totalReviews >= 4 && allAtOrBelowMidline) {
    candidates.push({
      tier: 1,
      category: 'bucket',
      text: `Across ${totalReviews} reviews, you have never exceeded expectations. We remain optimistic.`,
    });
  }

  // Consistently exceeding (still no promotion — that's the joke).
  const allExceeding = allBuckets.every(
    (b) => b === 'exceeds_expectations' || b === 'strongly_exceeds'
  );
  if (totalReviews >= 3 && allExceeding) {
    candidates.push({
      tier: 2,
      category: 'bucket',
      text: `${totalReviews} consecutive cycles of "exceeds." Promotion remains under review. Committee scheduling conflicts continue.`,
    });
  }

  // --- ARCHETYPE rules ---

  const allArchetypes = [...history.map((r) => r.archetype), current.archetype];
  const trailingArchetypeRun = countTrailingSame(allArchetypes);

  if (trailingArchetypeRun >= 3) {
    candidates.push({
      tier: 2,
      category: 'archetype',
      text: `You are, once again, ${archetypeName(current.archetype)}. At some point, this becomes who you are.`,
    });
  } else if (history.length >= 1) {
    const previous = history[history.length - 1].archetype;
    if (previous !== current.archetype) {
      candidates.push({
        tier: 3,
        category: 'archetype',
        text: `Last cycle you were ${archetypeName(previous)}. This cycle you are ${archetypeName(current.archetype)}. We find this "inconsistent, but interesting."`,
      });
    }
  }

  // --- DIFFICULTY rules ---

  if (history.length >= 1) {
    const previousDifficulty = history[history.length - 1].difficulty;
    if (previousDifficulty !== current.difficulty) {
      const ranking: Record<Difficulty, number> = { junior: 0, senior: 1, principal: 2 };
      const moved = ranking[current.difficulty] - ranking[previousDifficulty];
      if (moved > 0) {
        candidates.push({
          tier: 3,
          category: 'difficulty',
          text: `You have leveled up to ${labelForDifficulty(current.difficulty)}. The expectations have followed suit. Your trajectory remains "aspirational."`,
        });
      } else if (moved < 0) {
        candidates.push({
          tier: 3,
          category: 'difficulty',
          text: `You have stepped down to ${labelForDifficulty(current.difficulty)}. This is not unusual after the year you've had.`,
        });
      }
    }
  }

  // --- Selection: pick top 1–2, prefer higher tier (lower number),
  //     dedupe by category so the lines don't feel repetitive. ---

  candidates.sort((a, b) => a.tier - b.tier);

  const chosen: CandidateLine[] = [];
  const seenCategories = new Set<string>();
  for (const candidate of candidates) {
    if (seenCategories.has(candidate.category)) continue;
    chosen.push(candidate);
    seenCategories.add(candidate.category);
    if (chosen.length >= 2) break;
  }

  return chosen.map((c) => c.text);
}

function countTrailingSame<T>(arr: T[]): number {
  if (arr.length === 0) return 0;
  const last = arr[arr.length - 1];
  let count = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === last) count++;
    else break;
  }
  return count;
}

function labelForDifficulty(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'junior': return 'Junior PM';
    case 'senior': return 'Senior PM';
    case 'principal': return 'Principal PM';
  }
}
