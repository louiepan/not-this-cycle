import {
  type PendingDecision,
  type GameState,
  type EngineAction,
  type DifficultyConfig,
  type Stakeholder,
  type Decision,
  type Choice,
  type EscalationStage,
  type ResolvedDecision,
  type StateEffect,
  type Seniority,
} from './types';
import { EventScheduler } from './EventScheduler';

// When auto-resolve fires AFTER the player made vague attempts, we infer the
// best-matched choice and apply its effects at this multiplier. The player
// expressed intent, just not clearly — so they get partial credit (or partial
// blame) instead of the pure-timeout debt. Tuned so a fallback resolution
// can't earn a higher effective score than a clean, in-time match.
const LOW_CONFIDENCE_EFFECT_SCALE = 0.5;
const LOW_CONFIDENCE_DEBT_SCALE = 0.4;

const RESPONSIVENESS_COST: Record<Seniority, number> = {
  'c-suite': 10,
  'vp': 8,
  'director': 7,
  'manager': 5,
  'ic': 3,
};

/**
 * Handles decision timeouts, escalation stages, and auto-resolution.
 * When a decision goes unanswered:
 *   1. Original choices are replaced with worse options
 *   2. Escalation event fires (follow-up message)
 *   3. ResponsivenessDebt increases scaled by seniority
 *   4. If still unanswered, auto-resolves
 */
export class EscalationManager {
  private difficulty: DifficultyConfig;
  private scheduler: EventScheduler;
  private stakeholdersBySeniority: Map<string, Seniority> = new Map();
  // Elapsed time at which each stage of a given decision fired. Length is the
  // number of stages already processed. Used to avoid re-escalating every tick
  // and to compute per-stage deadlines.
  private stageFireTimes: Map<string, number[]> = new Map();

  constructor(
    difficulty: DifficultyConfig,
    scheduler: EventScheduler,
    stakeholders: Stakeholder[]
  ) {
    this.difficulty = difficulty;
    this.scheduler = scheduler;
    for (const s of stakeholders) {
      this.stakeholdersBySeniority.set(s.id, s.seniority);
    }
  }

  /**
   * Check all pending decisions for timeouts.
   * Returns actions for any that have timed out.
   */
  checkEscalations(state: GameState, elapsed: number): EngineAction[] {
    const actions: EngineAction[] = [];

    for (const pending of state.pendingDecisions) {
      const event = this.scheduler.getEvent(pending.eventId);
      const escalation = event?.decision?.escalation;

      if (!escalation) {
        // No escalation config — auto-resolve at the decision's deadline.
        const deadline = pending.presentedAt + pending.timeout;
        if (elapsed < deadline) continue;
        actions.push(...this.autoResolve(pending, event?.decision));
        continue;
      }

      const fireTimes = this.stageFireTimes.get(pending.decisionId) ?? [];
      const nextStageIndex = fireTimes.length;
      const { stages, autoResolve } = escalation;

      if (nextStageIndex < stages.length) {
        const stage = stages[nextStageIndex];
        const stageDeadline =
          nextStageIndex === 0
            ? pending.presentedAt + pending.timeout
            : fireTimes[nextStageIndex - 1] +
              stage.delay * this.difficulty.escalationTimeoutScale;

        if (elapsed < stageDeadline) continue;

        actions.push(...this.escalateToStage(pending, stage, nextStageIndex));
        fireTimes.push(elapsed);
        this.stageFireTimes.set(pending.decisionId, fireTimes);
        continue;
      }

      if (autoResolve) {
        const lastFireTime =
          fireTimes[fireTimes.length - 1] ?? pending.presentedAt + pending.timeout;
        const autoResolveDeadline =
          lastFireTime + autoResolve.delay * this.difficulty.escalationTimeoutScale;
        if (elapsed < autoResolveDeadline) continue;
        actions.push(...this.autoResolve(pending, event.decision));
        this.stageFireTimes.delete(pending.decisionId);
        continue;
      }

      // No more stages, no auto-resolve — close it.
      actions.push({ type: 'close_decision', decisionId: pending.decisionId });
      this.stageFireTimes.delete(pending.decisionId);
    }

    return actions;
  }

  private escalateToStage(
    pending: PendingDecision,
    stage: EscalationStage,
    stageIndex: number
  ): EngineAction[] {
    const actions: EngineAction[] = [];

    // Apply escalation state penalties
    for (const effect of stage.effects) {
      actions.push({
        type: 'update_state',
        variable: effect.variable,
        delta: effect.delta,
        tag: effect.tag,
      });
    }

    // Add responsiveness debt based on seniority
    const seniority = this.getDecisionSeniority(pending);
    const debtCost = RESPONSIVENESS_COST[seniority] || 5;
    actions.push({
      type: 'update_state',
      variable: 'responsivenessDebt',
      delta: debtCost,
      tag: `ignored-${seniority}`,
    });

    // Schedule the stage's follow-up event to fire. The event was authored as
    // reactive-only (no triggerAt/triggerAfter), so we inject a triggerAfter
    // pointing at the source event — the scheduler will materialize it on the
    // next tick.
    const stageEvent = this.scheduler.getEvent(stage.eventId);
    if (stageEvent) {
      this.scheduler.addEvent({
        ...stageEvent,
        triggerAt: undefined,
        triggerAfter: { eventId: pending.eventId, delay: 0 },
      });
    }

    // Telemetry/UI signal that an escalation occurred
    actions.push({
      type: 'escalate',
      decisionId: pending.decisionId,
      stage: stageIndex + 1,
    });

    // If the stage has a replacement decision, close current and present new
    if (stage.replacementDecision) {
      actions.push({ type: 'close_decision', decisionId: pending.decisionId });
      const scaledTimeout =
        stage.replacementDecision.timeout * this.difficulty.escalationTimeoutScale;
      actions.push({
        type: 'present_decision',
        decision: {
          decisionId: stage.replacementDecision.id,
          eventId: pending.eventId,
          channel: pending.channel,
          presentedAt: pending.presentedAt + pending.timeout,
          timeout: scaledTimeout,
          choices: stage.replacementDecision.choices,
          escalationStage: stageIndex + 1,
          askerId: pending.askerId,
          attempts: [],
          pushBackStrikes: 0,
        },
      });
    }

    return actions;
  }

  private autoResolve(
    pending: PendingDecision,
    decision?: Decision
  ): EngineAction[] {
    const actions: EngineAction[] = [];
    const autoResolve = decision?.escalation?.autoResolve;
    const attempts = pending.attempts ?? [];
    const seniority = this.getDecisionSeniority(pending);

    // Graceful degradation: if the player typed during this decision but
    // never landed a confident match, infer the best-fitting choice from
    // their attempts and apply its effects at half weight. They tried.
    if (attempts.length > 0 && decision && decision.choices.length > 0) {
      const fallback = this.buildFallbackResolution(
        pending,
        decision.choices,
        attempts,
        seniority
      );
      for (const effect of fallback.effects) {
        actions.push({
          type: 'update_state',
          variable: effect.variable,
          delta: effect.delta,
          tag: effect.tag,
        });
      }
      actions.push({
        type: 'auto_resolve',
        decisionId: pending.decisionId,
        description:
          'Resolved from best-effort interpretation of your replies after timeout.',
        resolution: fallback,
      });
      actions.push({ type: 'close_decision', decisionId: pending.decisionId });
      return actions;
    }

    // Pure timeout — player never typed in the decision channel.
    const effectsApplied: StateEffect[] = [];
    if (autoResolve) {
      for (const effect of autoResolve.effects) {
        actions.push({
          type: 'update_state',
          variable: effect.variable,
          delta: effect.delta,
          tag: effect.tag,
        });
        effectsApplied.push(effect);
      }
    } else {
      const debtCost = RESPONSIVENESS_COST[seniority] || 5;
      const effect: StateEffect = {
        variable: 'responsivenessDebt',
        delta: debtCost,
        tag: `ignored-${seniority}`,
      };
      actions.push({ type: 'update_state', ...effect });
      effectsApplied.push(effect);
    }

    const timeoutResolution: ResolvedDecision = {
      decisionId: pending.decisionId,
      choiceId: null,
      // resolvedAt is overwritten in GameEngine.processActions to the live clock.
      resolvedAt: 0,
      effects: effectsApplied,
      tags: ['auto-resolved', 'timeout'],
      wasDefer: false,
      contradicts: null,
      eventId: pending.eventId,
      channel: pending.channel,
      presentedAt: pending.presentedAt,
      wasAutoResolved: true,
      pushBackStrikes: pending.pushBackStrikes ?? 0,
      playerAttempts: [],
      matchSource: 'timeout',
    };

    actions.push({
      type: 'auto_resolve',
      decisionId: pending.decisionId,
      description:
        autoResolve?.description ?? 'Decision expired without a response.',
      resolution: timeoutResolution,
    });
    actions.push({ type: 'close_decision', decisionId: pending.decisionId });
    return actions;
  }

  private buildFallbackResolution(
    pending: PendingDecision,
    choices: Choice[],
    attempts: NonNullable<PendingDecision['attempts']>,
    seniority: Seniority
  ): ResolvedDecision {
    // Prefer the highest-confidence attempt; ties break to the most recent.
    const bestAttempt = attempts.reduce((best, current) => {
      if (current.confidence > best.confidence) return current;
      if (
        current.confidence === best.confidence &&
        current.timestamp > best.timestamp
      ) {
        return current;
      }
      return best;
    }, attempts[0]);

    const matchedChoice =
      choices.find((c) => c.id === bestAttempt.bestChoiceId) ?? choices[0];

    const scaledEffects: StateEffect[] = matchedChoice.effects.map((effect) => ({
      variable: effect.variable,
      delta:
        effect.delta >= 0
          ? Math.ceil(effect.delta * LOW_CONFIDENCE_EFFECT_SCALE)
          : Math.floor(effect.delta * LOW_CONFIDENCE_EFFECT_SCALE),
      tag: `${effect.tag}-low-conf`,
    }));

    const partialDebt = Math.max(
      1,
      Math.round((RESPONSIVENESS_COST[seniority] || 5) * LOW_CONFIDENCE_DEBT_SCALE)
    );
    scaledEffects.push({
      variable: 'responsivenessDebt',
      delta: partialDebt,
      tag: `partial-${seniority}`,
    });

    return {
      decisionId: pending.decisionId,
      choiceId: matchedChoice.id,
      resolvedAt: 0,
      effects: scaledEffects,
      tags: ['low-confidence-fallback', ...scaledEffects.map((e) => e.tag)],
      wasDefer: matchedChoice.isDefer ?? false,
      contradicts: matchedChoice.contradicts ?? null,
      playerText: bestAttempt.text,
      eventId: pending.eventId,
      channel: pending.channel,
      presentedAt: pending.presentedAt,
      wasAutoResolved: true,
      pushBackStrikes: pending.pushBackStrikes ?? attempts.length,
      playerAttempts: [...attempts],
      matchConfidence: bestAttempt.confidence,
      matchSource: 'low_confidence_fallback',
    };
  }

  private getDecisionSeniority(pending: PendingDecision): Seniority {
    // Try to find the stakeholder from the event's messages
    const event = this.scheduler.getEvent(pending.eventId);
    if (event?.messages.length) {
      const fromId = event.messages[0].from;
      return this.stakeholdersBySeniority.get(fromId) || 'ic';
    }
    return 'ic';
  }
}
