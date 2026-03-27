'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import { RatingEngine } from '@/engine/RatingEngine';
import {
  analyzePlayerReply,
  matchChoice,
  CONFIDENCE_THRESHOLD,
} from '@/engine/ChoiceMatcher';
import type {
  Scenario,
  ChannelDef,
  DifficultyConfig,
  GameState,
  Choice,
  EngineAction,
  Stakeholder,
  RatingResult,
} from '@/engine/types';
import { DIFFICULTIES } from '@/engine/types';
import { useGameClock } from './useGameClock';
import { track, initTracker, flush } from '@/analytics/tracker';
import { requestNarrativeReview, requestNarrativeTurn } from '@/narrative/client';
import type { NarrativeReactionMessage } from '@/narrative/types';
import { buildPeerFeedback } from '@/review/buildPeerFeedback';
import {
  addTypingParticipant,
  getTypingNamesForChannel,
  removeTypingParticipant,
  type TypingState,
} from './typingState';

export type SessionPhase = 'menu' | 'playing' | 'review';

interface UseGameSessionReturn {
  phase: SessionPhase;
  gameState: GameState | null;
  ratingResult: RatingResult | null;
  stakeholders: Stakeholder[];
  stakeholderNames: Record<string, string>;
  channels: ChannelDef[];
  elapsed: number;
  difficulty: DifficultyConfig;
  typingNames: string[];
  nudgeMessage: string | null;

  startGame: (difficulty: DifficultyConfig) => void;
  resetGame: () => void;
  resolveDecision: (decisionId: string, choice: Choice, playerText?: string) => void;
  submitText: (channelId: string, text: string) => void;
  switchChannel: (channelId: string) => void;
  formatGameTime: (ms: number) => string;
  formatClockDisplay: () => string;
}

export function useGameSession(scenario: Scenario): UseGameSessionReturn {
  const [phase, setPhase] = useState<SessionPhase>('menu');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [ratingResult, setRatingResult] = useState<RatingResult | null>(null);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [typingState, setTypingState] = useState<TypingState>({});
  const [difficulty, setDifficulty] = useState<DifficultyConfig>(DIFFICULTIES.senior);
  const [channels, setChannels] = useState<ChannelDef[]>([]);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const ratingEngineRef = useRef(new RatingEngine());
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const pendingNarrativeTurnsRef = useRef<Set<string>>(new Set());
  const reviewRequestedRef = useRef(false);
  const reviewRequestVersionRef = useRef(0);
  const nudgeActiveRef = useRef(false);

  const clearTypingTimeouts = useCallback(() => {
    for (const timeout of typingTimeoutsRef.current.values()) {
      clearTimeout(timeout);
    }
    typingTimeoutsRef.current.clear();
  }, []);

  useEffect(() => clearTypingTimeouts, [clearTypingTimeouts]);

  const handleActions = useCallback(
    (actions: EngineAction[]) => {
      // Handle typing_started actions
      const typingActions = actions.filter(
        (a) => a.type === 'typing_started'
      );
      if (typingActions.length > 0) {
        setTypingState((prev) =>
          typingActions.reduce((nextState, action) => {
            if (action.type !== 'typing_started') return nextState;
            return addTypingParticipant(
              nextState,
              action.channel,
              action.stakeholderId
            );
          }, prev)
        );
      }

      // Clear typing when messages are actually delivered
      const messageActions = actions.filter(
        (a) => a.type === 'deliver_message' && !a.message.isPlayerMessage
      );
      if (messageActions.length > 0) {
        for (const action of messageActions) {
          if (action.type !== 'deliver_message' || action.message.isPlayerMessage) {
            continue;
          }

          const timeoutKey = `${action.message.channel}:${action.message.from}`;
          const existingTimeout = typingTimeoutsRef.current.get(timeoutKey);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          const timeout = setTimeout(() => {
            setTypingState((prev) =>
              removeTypingParticipant(
                prev,
                action.message.channel,
                action.message.from
              )
            );
            typingTimeoutsRef.current.delete(timeoutKey);
          }, 300);

          typingTimeoutsRef.current.set(timeoutKey, timeout);
        }
      }

      for (const action of actions) {
        if (action.type === 'escalate') {
          track('decision_escalated', { decisionId: action.decisionId });
        }
        if (action.type === 'auto_resolve') {
          track('decision_auto_resolved', { decisionId: action.decisionId });
        }
      }
    },
    []
  );

  const onTick = useCallback((elapsed: number) => {
    const engine = engineRef.current;
    if (!engine) return;

    const actions = engine.tick(elapsed);
    const newState = engine.getState();
    setGameState(newState);

    handleActions(actions);

    if (engine.isComplete()) {
      clearTypingTimeouts();
      setTypingState({});
      const rating = buildPeerFeedback(ratingEngineRef.current.computeRating(newState));
      setRatingResult(rating);
      setPhase('review');
      track('game_complete', {
        compositeScore: rating.compositeScore,
        archetype: rating.archetype,
        bucket: rating.calibrationBucket,
      });
      flush();
    }
  }, [clearTypingTimeouts, handleActions]);

  const { elapsed, start: startClock, pause: stopClock } = useGameClock(onTick);

  const startGame = useCallback(
    (diff: DifficultyConfig) => {
      const seed = Date.now();
      const sessionId = `${seed}-${Math.random().toString(36).slice(2, 8)}`;
      initTracker(sessionId);
      sessionIdRef.current = sessionId;

      const engine = new GameEngine(scenario, diff, seed);
      engineRef.current = engine;
      engine.start();

      setDifficulty(diff);
      setStakeholders(engine.getStakeholders());
      setChannels(engine.getChannels());
      setPhase('playing');
      setGameState(engine.getState());
      setRatingResult(null);
      clearTypingTimeouts();
      setTypingState({});
      setNudgeMessage(null);
      pendingNarrativeTurnsRef.current.clear();
      reviewRequestedRef.current = false;
      reviewRequestVersionRef.current = 0;
      nudgeActiveRef.current = false;
      startClock();

      track('session_start', { difficulty: diff.id, seed });
      track('difficulty_selected', { difficulty: diff.id });
    },
    [clearTypingTimeouts, scenario, startClock]
  );

  const resetGame = useCallback(async () => {
    stopClock();
    await flush();
    sessionIdRef.current = null;
    engineRef.current = null;
    clearTypingTimeouts();
    setPhase('menu');
    setGameState(null);
    setRatingResult(null);
    setStakeholders([]);
    setTypingState({});
    setNudgeMessage(null);
    pendingNarrativeTurnsRef.current.clear();
    reviewRequestedRef.current = false;
    reviewRequestVersionRef.current = 0;
    nudgeActiveRef.current = false;
  }, [clearTypingTimeouts, stopClock]);

  const resolveDecision = useCallback(
    (
      decisionId: string,
      choice: Choice,
      playerText?: string,
      analysis?: ReturnType<typeof analyzePlayerReply>,
      options?: {
        skipReactiveFollowUp?: boolean;
        reactionMessages?: NarrativeReactionMessage[];
        reactionChannelId?: string;
      }
    ) => {
      const engine = engineRef.current;
      if (!engine) return;

      engine.resolve(decisionId, choice.id, playerText, analysis, {
        skipReactiveFollowUp: options?.skipReactiveFollowUp,
      });
      if (options?.reactionMessages && options.reactionMessages.length > 0) {
        engine.injectNarrativeMessages(
          options.reactionChannelId ?? engine.getState().activeChannel,
          options.reactionMessages.map((message) => ({
            id: message.id,
            from: message.from,
            content: message.content,
            mentionsPlayer: message.mentionsPlayer,
            contextValue: message.contextValue,
          }))
        );
      }
      setGameState(engine.getState());
      setNudgeMessage(null);
      nudgeActiveRef.current = false;

      track('decision_made', {
        decisionId,
        choiceId: choice.id,
        tone: choice.tone,
        isDefer: choice.isDefer,
        freeformText: playerText ? true : false,
      });
    },
    []
  );

  const submitText = useCallback(
    (channelId: string, text: string) => {
      const engine = engineRef.current;
      const sessionId = sessionIdRef.current;
      if (!engine || !gameState) return;

      const pending = gameState.pendingDecisions.find(
        (d) => d.channel === channelId
      );

      if (!pending) {
        engine.addFreeformMessage(channelId, text);
        setGameState(engine.getState());
        return;
      }

      const applyLocalFallback = () => {
        const result = matchChoice(text, pending.choices);

        if (result.confidence < CONFIDENCE_THRESHOLD && !nudgeActiveRef.current) {
          nudgeActiveRef.current = true;
          setNudgeMessage('Could you say more? Try being more specific about what you want to do.');
          track('low_confidence_nudge', {
            decisionId: pending.decisionId,
            confidence: result.confidence,
            playerText: text,
          });
          return;
        }

        const analysis = analyzePlayerReply(
          text,
          engine.getStakeholders(),
          result.matchedTone
        );
        resolveDecision(pending.decisionId, result.choice, text, analysis);
      };

      if (pendingNarrativeTurnsRef.current.has(pending.decisionId)) {
        return;
      }

      if (!sessionId) {
        applyLocalFallback();
        return;
      }

      pendingNarrativeTurnsRef.current.add(pending.decisionId);

      void (async () => {
        try {
          const allowedBeatIds = Array.from(
            new Set(
              pending.choices.flatMap((choice) => [
                ...(choice.triggers ?? []),
                ...(choice.reactions?.map((reaction) => reaction.id) ?? []),
              ])
            )
          );

          const response = await requestNarrativeTurn({
            sessionId,
            scenarioId: scenario.id,
            seed: engine.getSeed(),
            difficulty: difficulty.id,
            playerText: text,
            allowLowConfidenceMatch: nudgeActiveRef.current,
            stakeholders: engine.getStakeholders(),
            messages: gameState.messages.slice(-20).map((message) => ({
              id: message.id,
              eventId: message.eventId,
              channel: message.channel,
              from: message.from,
              content: message.content,
              timestamp: message.timestamp,
              mentionsPlayer: message.mentionsPlayer,
              contextValue: message.contextValue,
              isPlayerMessage: message.isPlayerMessage,
            })),
            decision: {
              decisionId: pending.decisionId,
              eventId: pending.eventId,
              channelId: pending.channel,
              presentedAt: pending.presentedAt,
              timeout: pending.timeout,
              escalationStage: pending.escalationStage,
              choices: pending.choices,
            },
            engineSnapshot: {
              variables: gameState.variables,
              resolvedDecisions: gameState.resolvedDecisions,
              pendingDecisions: gameState.pendingDecisions,
              clock: gameState.clock,
            },
            allowedBeatIds,
            fallbackPlan: ['heuristic_matcher', 'authored_reactions', 'static_choice'],
          });

          if (response.nudgeMessage) {
            nudgeActiveRef.current = true;
            setNudgeMessage(response.nudgeMessage);
            track('low_confidence_nudge', {
              decisionId: pending.decisionId,
              confidence: response.confidence,
              playerText: text,
            });
            return;
          }

          const localMatch = matchChoice(text, pending.choices);
          const matchedChoice =
            pending.choices.find((choice) => choice.id === response.matchedChoiceId) ??
            localMatch.choice;

          resolveDecision(
            pending.decisionId,
            matchedChoice,
            text,
            response.analysis,
            {
              skipReactiveFollowUp: response.reactionMessages.length > 0,
              reactionMessages: response.reactionMessages,
              reactionChannelId: channelId,
            }
          );

          track(
            response.fallbackUsed ? 'narrative_turn_fallback' : 'narrative_turn_applied',
            {
              decisionId: pending.decisionId,
              choiceId: matchedChoice.id,
              provider: response.routingDecision?.providerId ?? null,
              model: response.routingDecision?.modelId ?? null,
              fallbackReason: response.fallbackReason,
            }
          );
        } catch {
          applyLocalFallback();
        } finally {
          pendingNarrativeTurnsRef.current.delete(pending.decisionId);
        }
      })();
    },
    [difficulty.id, gameState, resolveDecision, scenario.id]
  );

  const switchChannel = useCallback((channelId: string) => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.switchChannel(channelId);
    setGameState(engine.getState());
    setNudgeMessage(null);
    nudgeActiveRef.current = false;

    track('channel_switch', { channelId });
  }, []);

  const stakeholderNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of stakeholders) {
      map[s.id] = s.name;
    }
    return map;
  }, [stakeholders]);

  const typingNames = useMemo(() => {
    if (!gameState) return [];
    return getTypingNamesForChannel(
      typingState,
      gameState.activeChannel,
      stakeholders
    );
  }, [gameState, stakeholders, typingState]);

  const formatGameTime = useCallback((ms: number): string => {
    // The full real-time session maps to an 8-hour in-game workday (9 AM -> 5 PM).
    const gameMinutes = Math.floor((ms / scenario.durationTarget) * 480);
    const totalMinutes = 9 * 60 + gameMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const h = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }, [scenario.durationTarget]);

  const formatClockDisplay = useCallback((): string => {
    const remaining = Math.max(
      0,
      (scenario.durationTarget * (difficulty?.timingScale || 1) - elapsed) / 1000
    );
    const m = Math.floor(remaining / 60);
    const s = Math.floor(remaining % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [elapsed, scenario.durationTarget, difficulty]);

  useEffect(() => {
    if (phase !== 'review' || !ratingResult || stakeholders.length === 0) {
      return;
    }

    if (reviewRequestedRef.current) {
      return;
    }

    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      return;
    }

    reviewRequestedRef.current = true;
    const requestVersion = ++reviewRequestVersionRef.current;

    void requestNarrativeReview({
      sessionId,
      scenarioId: scenario.id,
      stakeholders,
      ratingResult,
    })
      .then((response) => {
        if (reviewRequestVersionRef.current !== requestVersion) {
          return;
        }

        setRatingResult((current) => {
          if (!current) return current;
          return {
            ...current,
            managerReview: response.managerReview,
            peerFeedback: response.peerFeedback.length > 0
              ? response.peerFeedback
              : current.peerFeedback,
            calibrationOutcome:
              response.calibrationOutcome ?? current.calibrationOutcome,
          };
        });

        track('narrative_review_applied', {
          fallbackUsed: response.fallbackUsed,
          provider: response.routingDecision?.providerId ?? null,
          model: response.routingDecision?.modelId ?? null,
        });
      })
      .catch(() => {
        // Keep the deterministic review content when generation fails.
      });
  }, [phase, ratingResult, scenario.id, stakeholders]);

  return {
    phase,
    gameState,
    ratingResult,
    stakeholders,
    stakeholderNames,
    channels,
    elapsed,
    difficulty,
    typingNames,
    nudgeMessage,
    startGame,
    resetGame,
    resolveDecision,
    submitText,
    switchChannel,
    formatGameTime,
    formatClockDisplay,
  };
}
