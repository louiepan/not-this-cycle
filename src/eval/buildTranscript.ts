import type {
  Decision,
  GameState,
  RatingResult,
  ScenarioWorld,
  Stakeholder,
} from '@/engine/types';
import type { Transcript, TranscriptDecision } from './types';

export interface BuildTranscriptInput {
  sessionId: string;
  createdAt: string;
  durationMs: number;
  scenarioId: string;
  seed: number;
  difficulty: 'junior' | 'senior' | 'principal';
  playerName: string;
  world: ScenarioWorld;
  stakeholders: Stakeholder[];
  gameState: GameState;
  // Map of decisionId -> push-back strike count tracked client-side. The engine
  // now also tracks this on the ResolvedDecision; this map is kept for backwards
  // compatibility and used as a fallback when the engine value is missing.
  pushBackStrikes: Map<string, number>;
  // The decisions as authored, so we can include their original choices
  authoredDecisions: Decision[];
  finalRating: RatingResult;
}

export function buildTranscript(input: BuildTranscriptInput): Transcript {
  const decisions: TranscriptDecision[] = [];

  // Each entry in resolvedDecisions corresponds to one historical decision.
  for (const resolved of input.gameState.resolvedDecisions) {
    const authored = input.authoredDecisions.find((d) => d.id === resolved.decisionId);
    const matchSource = resolved.matchSource ?? 'timeout';
    const pushBackStrikes =
      resolved.pushBackStrikes ?? input.pushBackStrikes.get(resolved.decisionId) ?? 0;

    decisions.push({
      decisionId: resolved.decisionId,
      eventId: resolved.eventId ?? 'unknown',
      channel: resolved.channel ?? 'unknown',
      presentedAt: resolved.presentedAt ?? resolved.resolvedAt,
      resolvedAt: resolved.resolvedAt,
      choices:
        authored?.choices.map((c) => ({
          id: c.id,
          label: c.label,
          tone: c.tone,
        })) ?? [],
      outcome: {
        matchedChoiceId: resolved.choiceId,
        playerText: resolved.playerText ?? null,
        wasDefer: resolved.wasDefer,
        wasAutoResolved: resolved.wasAutoResolved ?? resolved.choiceId === null,
        pushBackStrikes,
        matchSource,
        matchConfidence: resolved.matchConfidence ?? null,
        attempts: (resolved.playerAttempts ?? []).map((attempt) => ({
          text: attempt.text,
          timestamp: attempt.timestamp,
          confidence: attempt.confidence,
          bestChoiceId: attempt.bestChoiceId,
        })),
      },
    });
  }

  return {
    schemaVersion: 1,
    sessionId: input.sessionId,
    createdAt: input.createdAt,
    durationMs: input.durationMs,
    scenarioId: input.scenarioId,
    seed: input.seed,
    difficulty: input.difficulty,
    playerName: input.playerName,
    world: input.world,
    stakeholders: input.stakeholders,
    messages: input.gameState.messages,
    decisions,
    finalVariables: input.gameState.variables,
    finalRating: input.finalRating,
  };
}
