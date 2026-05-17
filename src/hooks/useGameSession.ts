'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import { RatingEngine } from '@/engine/RatingEngine';
import { StaticContentProvider } from '@/engine/ContentProvider';
import {
  analyzePlayerReply,
  matchChoice,
  CONFIDENCE_THRESHOLD,
} from '@/engine/ChoiceMatcher';
import type {
  Scenario,
  ScenarioWorld,
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
import {
  requestFreetextReply,
  requestNarrativeReview,
  requestNarrativeTurn,
} from '@/narrative/client';
import type { NarrativeReactionMessage } from '@/narrative/types';
import { buildPeerFeedback } from '@/review/buildPeerFeedback';
import { buildTranscript } from '@/eval/buildTranscript';
import { buildEvaluationReport } from '@/eval/report';
import { saveReport, saveTranscript } from '@/eval/storage';
import {
  addTypingParticipant,
  getTypingNamesForChannel,
  removeTypingParticipant,
  type TypingState,
} from './typingState';

export type SessionPhase = 'menu' | 'playing' | 'review';

export interface OfferContext {
  senderName: string;
  senderRole: string;
  senderEmail: string;
  staffEngName: string;
  designLeadName: string;
  companyDomain: string;
}

// Picks which stakeholder should deliver an in-character push-back when the
// player's reply is too vague to match a choice. Prefers the askerId stamped
// on the pending decision (set by EventScheduler from the event's last
// message). Falls back to the most recent non-player speaker in the channel
// for legacy decisions that never recorded an askerId.
function findPushBackStakeholder(
  askerId: string | undefined,
  channelId: string,
  messages: GameState['messages'],
  stakeholders: Stakeholder[]
): Stakeholder | null {
  if (askerId) {
    const direct = stakeholders.find((s) => s.id === askerId);
    if (direct) return direct;
  }
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg.channel !== channelId) continue;
    if (msg.isPlayerMessage || msg.from === 'player') continue;
    const stakeholder = stakeholders.find((s) => s.id === msg.from);
    if (stakeholder) return stakeholder;
  }
  return null;
}

interface UseGameSessionReturn {
  phase: SessionPhase;
  gameState: GameState | null;
  ratingResult: RatingResult | null;
  stakeholders: Stakeholder[];
  // Stakeholders resolved for the upcoming session (rotating names + roles).
  // Available BEFORE startGame so the Day 1 briefing can render the cast list
  // with the same names the player will see in-game.
  previewStakeholders: Stakeholder[];
  stakeholderNames: Record<string, string>;
  channels: ChannelDef[];
  world: ScenarioWorld;
  offerContext: OfferContext;
  elapsed: number;
  difficulty: DifficultyConfig;
  typingNames: string[];
  nudgeMessage: string | null;
  sessionId: string | null;

  startGame: (difficulty: DifficultyConfig, playerName?: string) => void;
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
  const [sessionSeed, setSessionSeed] = useState<number>(() => Date.now());
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);

  const contentProvider = useMemo(
    () => new StaticContentProvider(scenario, sessionSeed),
    [scenario, sessionSeed]
  );
  const world = useMemo<ScenarioWorld>(() => contentProvider.getWorld(), [contentProvider]);
  const previewStakeholders = useMemo<Stakeholder[]>(
    () => contentProvider.getStakeholders(),
    [contentProvider]
  );
  const offerContext = useMemo<OfferContext>(() => {
    const provided = contentProvider.getStakeholders();
    const pick = (id: string) =>
      provided.find((s) => s.id === id) ?? provided[0];

    const manager = pick('the-manager');
    const staffEng = pick('the-staff-eng');
    const designLead = pick('the-design-lead');

    const [firstName = '', ...rest] = manager.name.split(/\s+/);
    const lastName = rest.join('');
    const domain =
      world.companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'work';
    const localPart = `${firstName[0] ?? ''}.${lastName}`.toLowerCase() || 'manager';

    return {
      senderName: manager.name,
      senderRole: 'Director of Product',
      senderEmail: `${localPart}@${domain}.com`,
      staffEngName: staffEng.name,
      designLeadName: designLead.name,
      companyDomain: domain,
    };
  }, [contentProvider, world]);

  const engineRef = useRef<GameEngine | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const ratingEngineRef = useRef(new RatingEngine());
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const pendingNarrativeTurnsRef = useRef<Set<string>>(new Set());
  const reviewRequestedRef = useRef(false);
  const reviewRequestVersionRef = useRef(0);
  // Tracks how many low-confidence push-backs we've shown per decision.
  // 0 = no push-back yet, 1 = tier 1 (template) shown, 2 = tier 2 (AI) shown.
  // On the third low-confidence attempt the server commits to a best-guess match.
  const pushBackStrikesRef = useRef<Map<string, number>>(new Map());
  // For transcript metadata captured on game completion.
  const sessionStartedAtRef = useRef<string | null>(null);
  const playerNameRef = useRef<string>('You');
  const gameCompleteRef = useRef(false);

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

    if (engine.isComplete() && !gameCompleteRef.current) {
      gameCompleteRef.current = true;
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

      // Capture transcript + evaluation report. Stored client-side; downloadable
      // from the review screen. Wrapped so a serialization failure can't crash
      // the end-of-game flow.
      try {
        const authoredDecisions = scenario.events
          .map((e) => e.decision)
          .filter((d): d is NonNullable<typeof d> => !!d);
        const transcript = buildTranscript({
          sessionId: sessionIdRef.current ?? `unknown-${Date.now()}`,
          createdAt: sessionStartedAtRef.current ?? new Date().toISOString(),
          durationMs: newState.clock,
          scenarioId: scenario.id,
          seed: engine.getSeed(),
          difficulty: difficulty.id,
          playerName: playerNameRef.current,
          world,
          stakeholders: engine.getStakeholders(),
          gameState: newState,
          pushBackStrikes: new Map(pushBackStrikesRef.current),
          authoredDecisions,
          finalRating: rating,
        });
        saveTranscript(transcript);
        const report = buildEvaluationReport(transcript);
        saveReport(report);
      } catch {
        // Eval/capture failure must not block the review screen.
      }
    }
  }, [clearTypingTimeouts, difficulty.id, handleActions, scenario.events, scenario.id, world]);

  const { elapsed, start: startClock, pause: stopClock } = useGameClock(onTick);

  const startGame = useCallback(
    (diff: DifficultyConfig, playerName: string = 'You') => {
      const seed = sessionSeed;
      const sessionId = `${seed}-${Math.random().toString(36).slice(2, 8)}`;
      initTracker(sessionId);
      sessionIdRef.current = sessionId;
      sessionStartedAtRef.current = new Date().toISOString();
      playerNameRef.current = playerName;

      const engine = new GameEngine(scenario, diff, seed, {
        name: playerName,
        title: diff.label,
      });
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
      pushBackStrikesRef.current.clear();
      gameCompleteRef.current = false;
      startClock();

      track('session_start', { difficulty: diff.id, seed });
      track('difficulty_selected', { difficulty: diff.id });
    },
    [clearTypingTimeouts, scenario, sessionSeed, startClock]
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
    setSessionSeed(Date.now());
    pendingNarrativeTurnsRef.current.clear();
    reviewRequestedRef.current = false;
    reviewRequestVersionRef.current = 0;
    pushBackStrikesRef.current.clear();
    gameCompleteRef.current = false;
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
        matchConfidence?: number;
      }
    ) => {
      const engine = engineRef.current;
      if (!engine) return;

      engine.resolve(decisionId, choice.id, playerText, analysis, {
        skipReactiveFollowUp: options?.skipReactiveFollowUp,
        matchConfidence: options?.matchConfidence,
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
      pushBackStrikesRef.current.delete(decisionId);

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

        // If the player @-mentioned a stakeholder, fire an LLM call to get an
        // in-character reply so the channel doesn't feel dead. Silent failure
        // is the fallback (silence beats a bad templated line).
        const analysis = analyzePlayerReply(text, engine.getStakeholders());
        if (sessionId && analysis.addressedStakeholderIds.length > 0) {
          void (async () => {
            try {
              const response = await requestFreetextReply({
                sessionId,
                scenarioId: scenario.id,
                seed: engine.getSeed(),
                difficulty: difficulty.id,
                channelId,
                playerText: text,
                addressedStakeholderIds: analysis.addressedStakeholderIds,
                world,
                stakeholders: engine.getStakeholders(),
                messages: engine
                  .getState()
                  .messages.filter((message) => message.channel === channelId)
                  .slice(-12)
                  .map((message) => ({
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
              });
              if (response.reactionMessages.length > 0) {
                engine.injectNarrativeMessages(
                  channelId,
                  response.reactionMessages.map((message) => ({
                    id: message.id,
                    from: message.from,
                    content: message.content,
                    mentionsPlayer: message.mentionsPlayer,
                    contextValue: message.contextValue,
                  }))
                );
                setGameState(engine.getState());
                track('freetext_reply_applied', {
                  channelId,
                  addressedCount: analysis.addressedStakeholderIds.length,
                  replyCount: response.reactionMessages.length,
                  fallbackUsed: response.fallbackUsed,
                });
              }
            } catch {
              // Silence is acceptable. Better than a generic templated reply.
            }
          })();
        }
        return;
      }

      const tryInjectPushBack = (
        decisionId: string,
        channel: string,
        askerId: string | undefined,
        attempt: { text: string; confidence: number; bestChoiceId: string }
      ): boolean => {
        // Record the attempt unconditionally — it feeds the graceful-degradation
        // auto-resolve even if a push-back ends up not firing this round.
        engine.recordAttempt(decisionId, attempt.text, {
          confidence: attempt.confidence,
          bestChoiceId: attempt.bestChoiceId,
        });

        const strikes = pushBackStrikesRef.current.get(decisionId) ?? 0;
        if (strikes >= 2) {
          setGameState(engine.getState());
          return false;
        }
        const currentMessages = engine.getState().messages;
        const asker = findPushBackStakeholder(
          askerId,
          channel,
          currentMessages,
          engine.getStakeholders()
        );
        if (!asker || asker.personality.pushBackLines.length === 0) {
          setGameState(engine.getState());
          return false;
        }
        const line = asker.personality.pushBackLines[
          strikes % asker.personality.pushBackLines.length
        ];
        const resolved = contentProvider.resolveTemplate(line, engine.getStakeholders());
        engine.injectNarrativeMessages(channel, [
          {
            id: `pushback-${decisionId}-${strikes}-${Date.now()}`,
            from: asker.id,
            content: resolved,
            mentionsPlayer: true,
          },
        ]);
        pushBackStrikesRef.current.set(decisionId, strikes + 1);
        setGameState(engine.getState());
        return true;
      };

      const applyLocalFallback = () => {
        const result = matchChoice(text, pending.choices);
        const strikes = pushBackStrikesRef.current.get(pending.decisionId) ?? 0;

        if (result.confidence < CONFIDENCE_THRESHOLD && strikes < 2) {
          engine.addFreeformMessage(channelId, text);
          track('low_confidence_nudge', {
            decisionId: pending.decisionId,
            confidence: result.confidence,
            playerText: text,
            strike: strikes,
          });
          tryInjectPushBack(pending.decisionId, channelId, pending.askerId, {
            text,
            confidence: result.confidence,
            bestChoiceId: result.choice.id,
          });
          return;
        }

        const analysis = analyzePlayerReply(
          text,
          engine.getStakeholders(),
          result.matchedTone
        );
        resolveDecision(pending.decisionId, result.choice, text, analysis, {
          matchConfidence: result.confidence,
        });
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
            allowLowConfidenceMatch:
              (pushBackStrikesRef.current.get(pending.decisionId) ?? 0) >= 2,
            world,
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
            engine.addFreeformMessage(channelId, text);
            const strikes = pushBackStrikesRef.current.get(pending.decisionId) ?? 0;
            track('low_confidence_nudge', {
              decisionId: pending.decisionId,
              confidence: response.confidence,
              playerText: text,
              strike: strikes,
            });
            const localMatch = matchChoice(text, pending.choices);
            tryInjectPushBack(pending.decisionId, channelId, pending.askerId, {
              text,
              confidence: response.confidence ?? localMatch.confidence,
              bestChoiceId: response.matchedChoiceId ?? localMatch.choice.id,
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
              matchConfidence: response.confidence ?? localMatch.confidence,
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
    [contentProvider, difficulty.id, gameState, resolveDecision, scenario.id, world]
  );

  const switchChannel = useCallback((channelId: string) => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.switchChannel(channelId);
    setGameState(engine.getState());
    setNudgeMessage(null);

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
      world,
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
  }, [phase, ratingResult, scenario.id, stakeholders, world]);

  return {
    phase,
    gameState,
    ratingResult,
    stakeholders,
    previewStakeholders,
    stakeholderNames,
    channels,
    world,
    offerContext,
    elapsed,
    difficulty,
    typingNames,
    nudgeMessage,
    sessionId: sessionIdRef.current,
    startGame,
    resetGame,
    resolveDecision,
    submitText,
    switchChannel,
    formatGameTime,
    formatClockDisplay,
  };
}
