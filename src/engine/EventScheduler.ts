import {
  type GameEvent,
  type GameState,
  type DifficultyConfig,
  type DeliveredMessage,
  type PendingDecision,
  type EngineAction,
  type EventPriority,
} from './types';

interface ScheduledMessage {
  message: Omit<DeliveredMessage, 'timestamp'>;
  deliverAt: number;
  priority: EventPriority;
}

interface ScheduledDecision {
  decision: PendingDecision;
  presentAt: number;
}

const PRIORITY_ORDER: Record<EventPriority, number> = {
  escalation: 0,
  decision: 1,
  ambient: 2,
};

/**
 * Manages the timeline of events. On each tick, checks which events
 * are ready to fire based on elapsed time, conditions, and dependencies.
 * Uses elapsed-time comparison (not setInterval) to avoid browser drift.
 *
 * Emits typing_started actions before messages arrive so the UI can
 * show typing indicators. The lead time varies by difficulty.
 */
export class EventScheduler {
  private events: Map<string, GameEvent>;
  private pendingMessages: ScheduledMessage[] = [];
  private pendingDecisions: ScheduledDecision[] = [];
  private difficulty: DifficultyConfig;
  private resolvedEventTimestamps: Map<string, number> = new Map();
  private materializedEvents: Set<string> = new Set();
  private typingEmitted: Set<string> = new Set();

  constructor(events: GameEvent[], difficulty: DifficultyConfig) {
    this.events = new Map(events.map((e) => [e.id, e]));
    this.difficulty = difficulty;
  }

  /**
   * Main tick — called every ~100ms.
   * Returns actions for events whose trigger conditions are now met.
   */
  tick(state: GameState, elapsed: number): EngineAction[] {
    const actions: EngineAction[] = [];

    // 1. Check for events ready to fire
    for (const [id, event] of this.events) {
      if (this.materializedEvents.has(id)) continue;
      if (!this.isReady(event, state, elapsed)) continue;

      const eventActions = this.materializeEvent(event, elapsed);
      actions.push(...eventActions);
    }

    // 2. Emit typing indicators for messages about to arrive
    const leadTime = this.difficulty.typingLeadTimeMs;
    for (const scheduled of this.pendingMessages) {
      const msgId = scheduled.message.id;
      if (this.typingEmitted.has(msgId)) continue;
      if (scheduled.message.isPlayerMessage) continue;

      const typingWindowStart = scheduled.deliverAt - leadTime;
      if (elapsed >= typingWindowStart && elapsed < scheduled.deliverAt) {
        this.typingEmitted.add(msgId);
        actions.push({
          type: 'typing_started',
          channel: scheduled.message.channel,
          stakeholderId: scheduled.message.from as string,
        });
      }
    }

    // 3. Deliver pending messages whose time has come
    const readyMessages = this.pendingMessages.filter(
      (m) => m.deliverAt <= elapsed
    );

    readyMessages.sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.deliverAt - b.deliverAt;
    });

    for (const scheduled of readyMessages) {
      actions.push({
        type: 'deliver_message',
        message: { ...scheduled.message, timestamp: elapsed },
      });
    }

    this.pendingMessages = this.pendingMessages.filter(
      (m) => m.deliverAt > elapsed
    );

    // 4. Present queued decisions after the setup messages land
    const readyDecisions = this.pendingDecisions.filter(
      (scheduled) => scheduled.presentAt <= elapsed
    );

    readyDecisions.sort((a, b) => a.presentAt - b.presentAt);

    for (const scheduled of readyDecisions) {
      actions.push({
        type: 'present_decision',
        decision: scheduled.decision,
      });
    }

    this.pendingDecisions = this.pendingDecisions.filter(
      (scheduled) => scheduled.presentAt > elapsed
    );

    return actions;
  }

  private isReady(
    event: GameEvent,
    state: GameState,
    elapsed: number
  ): boolean {
    // Time-based trigger
    if (event.triggerAt !== undefined) {
      const scaledTime = event.triggerAt * this.difficulty.timingScale;
      if (elapsed < scaledTime) return false;
    }

    // Dependency-based trigger
    if (event.triggerAfter) {
      const depTimestamp = this.resolvedEventTimestamps.get(
        event.triggerAfter.eventId
      );
      if (depTimestamp === undefined) return false;
      const triggerTime =
        depTimestamp + event.triggerAfter.delay * this.difficulty.timingScale;
      if (elapsed < triggerTime) return false;
    }

    // Conditional trigger
    if (event.condition) {
      const { variable, operator, value } = event.condition;
      const current = state.variables[variable];
      switch (operator) {
        case 'gt': if (!(current > value)) return false; break;
        case 'lt': if (!(current < value)) return false; break;
        case 'eq': if (!(current === value)) return false; break;
        case 'gte': if (!(current >= value)) return false; break;
        case 'lte': if (!(current <= value)) return false; break;
      }
    }

    return true;
  }

  private materializeEvent(
    event: GameEvent,
    currentTime: number
  ): EngineAction[] {
    const priority = event.priority || 'decision';

    // Schedule messages with their delays
    for (const msg of event.messages) {
      const deliverAt =
        currentTime + msg.delay * this.difficulty.timingScale;

      this.pendingMessages.push({
        message: {
          id: msg.id,
          eventId: event.id,
          channel: event.channel,
          from: msg.from,
          content: msg.content,
          mentionsPlayer: msg.mentionsPlayer ?? false,
          contextValue: msg.contextValue ?? null,
          isPlayerMessage: false,
        },
        deliverAt,
        priority,
      });
    }

    // If event has a decision, schedule it after all messages
    if (event.decision) {
      const lastMessageDelay = Math.max(
        ...event.messages.map((m) => m.delay),
        0
      );
      const decisionTime =
        currentTime + lastMessageDelay * this.difficulty.timingScale + 500;

      const scaledTimeout =
        event.decision.timeout * this.difficulty.escalationTimeoutScale;

      this.pendingDecisions.push({
        presentAt: decisionTime,
        decision: {
          decisionId: event.decision.id,
          eventId: event.id,
          channel: event.channel,
          presentedAt: decisionTime,
          timeout: scaledTimeout,
          choices: event.decision.choices,
          escalationStage: 0,
        },
      });
    }

    this.resolvedEventTimestamps.set(event.id, currentTime);
    this.materializedEvents.add(event.id);

    return [];
  }

  getEvent(eventId: string): GameEvent | undefined {
    return this.events.get(eventId);
  }

  addEvent(event: GameEvent): void {
    this.events.set(event.id, event);
  }

  getPendingMessageCount(): number {
    return this.pendingMessages.length;
  }
}
