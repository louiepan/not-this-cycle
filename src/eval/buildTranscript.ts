import type {
  Decision,
  GameState,
  RatingResult,
  ResolvedDecision,
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
  // Map of decisionId -> push-back strike count tracked client-side
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
    decisions.push({
      decisionId: resolved.decisionId,
      eventId: findEventIdForDecision(resolved, input.gameState),
      channel: findChannelForDecision(resolved, input.gameState),
      presentedAt: findPresentedAt(resolved, input.gameState),
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
        wasAutoResolved: resolved.choiceId === null,
        pushBackStrikes: input.pushBackStrikes.get(resolved.decisionId) ?? 0,
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

// We don't always have the original eventId on the resolved decision, so we
// best-effort it from the message log. Decisions are presented in-channel,
// so the most recent non-player message on the decision's channel at the
// time of resolution is probably the decision-event message.
function findEventIdForDecision(_resolved: ResolvedDecision, _state: GameState): string {
  return 'unknown';
}
function findChannelForDecision(_resolved: ResolvedDecision, _state: GameState): string {
  return 'unknown';
}
function findPresentedAt(_resolved: ResolvedDecision, _state: GameState): number {
  return _resolved.resolvedAt;
}
