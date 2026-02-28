import type { Choice } from './types';

/**
 * Matches freeform player text to the closest available choice
 * using keyword overlap + tone heuristics.
 *
 * Tone is weighted heavily (0.6) because short player inputs like
 * "yes", "no", "let me think" carry strong tonal signal even without
 * keyword overlap. This is intentional — the game should reward
 * players for communicating clearly even in short messages.
 *
 * Returns { choice, confidence } so callers can apply a confidence
 * threshold and ask the player to elaborate if the match is weak.
 */

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'the', 'a', 'an', 'is',
  'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
  'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might',
  'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'it', 'its', 'this', 'that', 'and', 'or', 'but', 'if', 'then', 'so',
  'not', 'no', 'just', 'about', 'up', 'out', 'as', 'into', 'also',
]);

const TONE_SIGNALS: Record<string, string> = {
  'absolutely': 'committing',
  'definitely': 'committing',
  'sure': 'committing',
  'yes': 'committing',
  'commit': 'committing',
  'ship': 'committing',
  'lets go': 'committing',
  'on it': 'committing',
  'done': 'committing',
  'will do': 'committing',
  'got it': 'committing',
  'ok': 'committing',
  'okay': 'committing',
  'agree': 'diplomatic',
  'understand': 'diplomatic',
  'hear you': 'diplomatic',
  'makes sense': 'diplomatic',
  'fair': 'diplomatic',
  'balance': 'diplomatic',
  'both': 'diplomatic',
  'compromise': 'diplomatic',
  'work together': 'diplomatic',
  'align': 'diplomatic',
  'good point': 'diplomatic',
  'pushback': 'direct',
  'push back': 'direct',
  'disagree': 'direct',
  'concern': 'direct',
  'risk': 'direct',
  'realistic': 'direct',
  'honest': 'direct',
  'actually': 'direct',
  'problem': 'direct',
  'wrong': 'direct',
  'cant': 'direct',
  'wont work': 'direct',
  'wait': 'deflecting',
  'later': 'deflecting',
  'check': 'deflecting',
  'think about': 'deflecting',
  'need time': 'deflecting',
  'get back': 'deflecting',
  'circle back': 'deflecting',
  'not sure': 'deflecting',
  'maybe': 'deflecting',
  'hmm': 'deflecting',
  'idk': 'deflecting',
  'let me': 'deflecting',
};

export const CONFIDENCE_THRESHOLD = 0.15;

export interface MatchResult {
  choice: Choice;
  confidence: number;
  matchedTone: string | null;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractWords(text: string): string[] {
  return normalize(text).split(' ').filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function extractBigrams(words: string[]): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  return bigrams;
}

function keywordOverlap(playerWords: string[], choiceWords: string[]): number {
  if (choiceWords.length === 0 || playerWords.length === 0) return 0;
  const choiceSet = new Set(choiceWords);
  let matches = 0;
  for (const word of playerWords) {
    if (choiceSet.has(word)) matches++;
  }
  return matches / Math.max(playerWords.length, choiceWords.length);
}

function detectTone(text: string): string | null {
  const normalized = normalize(text);
  // Check multi-word signals first (more specific)
  const sortedSignals = Object.entries(TONE_SIGNALS).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [signal, tone] of sortedSignals) {
    if (normalized.includes(signal)) return tone;
  }
  return null;
}

export function matchChoice(playerText: string, choices: Choice[]): MatchResult {
  if (choices.length === 0) {
    throw new Error('No choices available to match against');
  }
  if (choices.length === 1) {
    return { choice: choices[0], confidence: 1.0, matchedTone: null };
  }

  const playerWords = extractWords(playerText);
  const playerBigrams = extractBigrams(playerWords);
  const playerTone = detectTone(playerText);

  let bestChoice = choices[0];
  let bestScore = -1;

  for (const choice of choices) {
    const choiceText = `${choice.label} ${choice.message}`;
    const choiceWords = extractWords(choiceText);
    const choiceBigrams = extractBigrams(choiceWords);

    const wordScore = keywordOverlap(playerWords, choiceWords);

    let bigramScore = 0;
    if (playerBigrams.length > 0 && choiceBigrams.length > 0) {
      const bigramSet = new Set(choiceBigrams);
      let bigramMatches = 0;
      for (const bg of playerBigrams) {
        if (bigramSet.has(bg)) bigramMatches++;
      }
      bigramScore = bigramMatches / Math.max(playerBigrams.length, choiceBigrams.length);
    }

    let toneScore = 0;
    if (playerTone && playerTone === choice.tone) {
      toneScore = 0.6;
    }

    const score = wordScore * 0.25 + bigramScore * 0.15 + toneScore;

    if (score > bestScore) {
      bestScore = score;
      bestChoice = choice;
    }
  }

  return {
    choice: bestChoice,
    confidence: Math.min(bestScore, 1.0),
    matchedTone: playerTone,
  };
}
