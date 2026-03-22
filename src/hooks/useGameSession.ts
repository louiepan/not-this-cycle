'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import { RatingEngine } from '@/engine/RatingEngine';
import { matchChoice, CONFIDENCE_THRESHOLD } from '@/engine/ChoiceMatcher';
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
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyConfig>(DIFFICULTIES.senior);
  const [channels, setChannels] = useState<ChannelDef[]>([]);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const ratingEngineRef = useRef(new RatingEngine());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nudgeActiveRef = useRef(false);

  const handleActions = useCallback(
    (actions: EngineAction[], engine: GameEngine) => {
      const stakeholders = engine.getStakeholders();

      // Handle typing_started actions
      const typingActions = actions.filter(
        (a) => a.type === 'typing_started'
      );
      if (typingActions.length > 0) {
        const names = typingActions
          .map((a) => {
            if (a.type !== 'typing_started') return null;
            const s = stakeholders.find((s) => s.id === a.stakeholderId);
            return s ? s.name.split(' ')[0] : null;
          })
          .filter(Boolean) as string[];

        if (names.length > 0) {
          setTypingNames((prev) => {
            const combined = new Set([...prev, ...names]);
            return Array.from(combined);
          });
        }
      }

      // Clear typing when messages are actually delivered
      const messageActions = actions.filter(
        (a) => a.type === 'deliver_message' && !a.message.isPlayerMessage
      );
      if (messageActions.length > 0) {
        const deliveredSenderIds = new Set(
          messageActions.map((a) =>
            a.type === 'deliver_message' ? a.message.from : ''
          )
        );

        const deliveredNames = stakeholders
          .filter((s) => deliveredSenderIds.has(s.id))
          .map((s) => s.name.split(' ')[0]);

        if (deliveredNames.length > 0) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingNames((prev) =>
              prev.filter((n) => !deliveredNames.includes(n))
            );
          }, 300);
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

    handleActions(actions, engine);

    if (engine.isComplete()) {
      const rating = ratingEngineRef.current.computeRating(newState);
      setRatingResult(rating);
      setPhase('review');
      track('game_complete', {
        compositeScore: rating.compositeScore,
        archetype: rating.archetype,
        bucket: rating.calibrationBucket,
      });
      flush();
    }
  }, [handleActions]);

  const { elapsed, start: startClock, pause: stopClock } = useGameClock(onTick);

  const startGame = useCallback(
    (diff: DifficultyConfig) => {
      const seed = Date.now();
      const sessionId = `${seed}-${Math.random().toString(36).slice(2, 8)}`;
      initTracker(sessionId);

      const engine = new GameEngine(scenario, diff, seed);
      engineRef.current = engine;
      engine.start();

      setDifficulty(diff);
      setStakeholders(engine.getStakeholders());
      setChannels(engine.getChannels());
      setPhase('playing');
      setGameState(engine.getState());
      setRatingResult(null);
      setTypingNames([]);
      setNudgeMessage(null);
      nudgeActiveRef.current = false;
      startClock();

      track('session_start', { difficulty: diff.id, seed });
      track('difficulty_selected', { difficulty: diff.id });
    },
    [scenario, startClock]
  );

  const resetGame = useCallback(async () => {
    stopClock();
    await flush();
    engineRef.current = null;
    setPhase('menu');
    setGameState(null);
    setRatingResult(null);
    setStakeholders([]);
    setTypingNames([]);
    setNudgeMessage(null);
    nudgeActiveRef.current = false;
  }, [stopClock]);

  const resolveDecision = useCallback(
    (decisionId: string, choice: Choice, playerText?: string) => {
      const engine = engineRef.current;
      if (!engine) return;

      engine.resolve(decisionId, choice.id, playerText);
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
      if (!engine || !gameState) return;

      const pending = gameState.pendingDecisions.find(
        (d) => d.channel === channelId
      );

      if (!pending) {
        engine.addFreeformMessage(channelId, text);
        setGameState(engine.getState());
        return;
      }

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

      // Accept the match (either good confidence or second attempt)
      resolveDecision(pending.decisionId, result.choice, text);
    },
    [gameState, resolveDecision]
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
