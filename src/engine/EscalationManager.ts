import {
  type PendingDecision,
  type GameState,
  type EngineAction,
  type DifficultyConfig,
  type Stakeholder,
  type Decision,
  type EscalationStage,
  type Seniority,
} from './types';
import { EventScheduler } from './EventScheduler';

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

    if (autoResolve) {
      for (const effect of autoResolve.effects) {
        actions.push({
          type: 'update_state',
          variable: effect.variable,
          delta: effect.delta,
          tag: effect.tag,
        });
      }
    } else {
      // No authored auto-resolve effects — apply a baseline responsiveness debt
      // so ignoring a decision always has weight, and the resolved-decision log
      // captures the ignore.
      const seniority = this.getDecisionSeniority(pending);
      const debtCost = RESPONSIVENESS_COST[seniority] || 5;
      actions.push({
        type: 'update_state',
        variable: 'responsivenessDebt',
        delta: debtCost,
        tag: `ignored-${seniority}`,
      });
    }

    actions.push({
      type: 'auto_resolve',
      decisionId: pending.decisionId,
      description: autoResolve?.description ?? 'Decision expired without a response.',
    });
    actions.push({ type: 'close_decision', decisionId: pending.decisionId });
    return actions;
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
