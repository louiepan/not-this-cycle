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
      const deadline = pending.presentedAt + pending.timeout;
      if (elapsed < deadline) continue;

      const event = this.scheduler.getEvent(pending.eventId);
      if (!event?.decision?.escalation) {
        // No escalation config — auto-resolve immediately
        actions.push(...this.autoResolve(pending, event?.decision));
        continue;
      }

      const { stages, autoResolve } = event.decision.escalation;
      const currentStage = pending.escalationStage;

      if (currentStage < stages.length) {
        actions.push(...this.escalateToStage(pending, stages[currentStage], currentStage));
      } else if (autoResolve) {
        actions.push(...this.autoResolve(pending, event.decision));
      } else {
        // No more stages, no auto-resolve — just close it
        actions.push({ type: 'close_decision', decisionId: pending.decisionId });
      }
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
    const firstMessage = pending.choices[0]; // use decision context
    const seniority = this.getDecisionSeniority(pending);
    const debtCost = RESPONSIVENESS_COST[seniority] || 5;
    actions.push({
      type: 'update_state',
      variable: 'responsivenessDebt',
      delta: debtCost,
      tag: `ignored-${seniority}`,
    });

    // Fire the escalation event
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
      actions.push({
        type: 'auto_resolve',
        decisionId: pending.decisionId,
        description: autoResolve.description,
      });
    }

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
