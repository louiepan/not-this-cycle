import { analyzePlayerReply, CONFIDENCE_THRESHOLD, matchChoice } from '@/engine/ChoiceMatcher';
import type { RatingResult } from '@/engine/types';
import { buildPeerFeedback } from '@/review/buildPeerFeedback';
import { createOpenLoop } from './memory';
import type {
  NarrativeAnalyzeOutput,
  NarrativeMemory,
  NarrativeMemoryPatch,
  NarrativeReviewRequest,
  NarrativeReviewResponse,
  NarrativeTurnRequest,
  NarrativeTurnResponse,
} from './types';

function buildMemoryPatch(
  request: NarrativeTurnRequest,
  matchedChoiceId: string,
  confidence: number
): NarrativeMemoryPatch {
  const matchedChoice = request.decision.choices.find((choice) => choice.id === matchedChoiceId);
  const analysis = analyzePlayerReply(request.playerText, request.stakeholders, matchedChoice?.tone);
  const timestamp = request.engineSnapshot.clock;

  const openLoops =
    analysis.signals.includes('ownership') || matchedChoice?.tone === 'committing'
      ? [
          createOpenLoop(
            request.playerText.slice(0, 120),
            timestamp,
            analysis.addressedStakeholderIds[0] ?? null,
            request.decision.decisionId
          ),
        ]
      : [];

  return {
    openLoops,
    decisionLedgerEntry: {
      decisionId: request.decision.decisionId,
      choiceId: matchedChoiceId,
      summary: request.playerText.slice(0, 180),
      timestamp,
      tags: matchedChoice?.effects.map((effect) => effect.tag) ?? [],
    },
    notableMoments:
      confidence < CONFIDENCE_THRESHOLD
        ? []
        : [
            {
              id: `moment-${timestamp}`,
              type: analysis.signals.includes('ownership') ? 'ownership' : 'commitment',
              summary: request.playerText.slice(0, 180),
              stakeholderIds: analysis.addressedStakeholderIds,
              timestamp,
            },
          ],
  };
}

export function createFallbackAnalyzeOutput(
  request: NarrativeTurnRequest
): NarrativeAnalyzeOutput {
  const result = matchChoice(request.playerText, request.decision.choices);
  return {
    matchedChoiceId: result.choice.id,
    confidence: result.confidence,
    tone: result.matchedTone,
    signals: analyzePlayerReply(
      request.playerText,
      request.stakeholders,
      result.matchedTone
    ).signals,
    addressedStakeholderIds: analyzePlayerReply(
      request.playerText,
      request.stakeholders,
      result.matchedTone
    ).addressedStakeholderIds,
    memoryPatch: buildMemoryPatch(request, result.choice.id, result.confidence),
    contradictionFlags: result.choice.contradicts ? [result.choice.contradicts] : [],
    complexityScore: 0,
  };
}

export function createTurnFallbackResponse(
  request: NarrativeTurnRequest,
  memory: NarrativeMemory,
  reason: string
): NarrativeTurnResponse {
  const fallback = createFallbackAnalyzeOutput(request);
  const choice = request.decision.choices.find((item) => item.id === fallback.matchedChoiceId);
  const analysis = analyzePlayerReply(request.playerText, request.stakeholders, fallback.tone);
  const shouldNudge =
    fallback.confidence < CONFIDENCE_THRESHOLD && !request.allowLowConfidenceMatch;

  return {
    matchedChoiceId: shouldNudge ? null : fallback.matchedChoiceId,
    confidence: fallback.confidence,
    analysis,
    memoryPatch: fallback.memoryPatch,
    selectedBeatId: choice?.triggers?.[0] ?? null,
    reactionMessages: [],
    routingDecision: null,
    fallbackUsed: true,
    fallbackReason: reason,
    nudgeMessage: shouldNudge
      ? 'Could you say more? Try being more specific about what you want to do.'
      : null,
  };
}

export function createFallbackReviewResponse(
  request: NarrativeReviewRequest,
  reason: string
): NarrativeReviewResponse {
  const defaultResult: RatingResult = buildPeerFeedback(request.ratingResult);

  return {
    managerReview: defaultResult.managerReview,
    peerFeedback: defaultResult.peerFeedback,
    calibrationOutcome: defaultResult.calibrationOutcome,
    routingDecision: null,
    fallbackUsed: true,
    fallbackReason: reason,
  };
}
