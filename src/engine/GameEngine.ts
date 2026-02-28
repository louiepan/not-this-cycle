import {
  type GameState,
  type GameEvent,
  type EngineAction,
  type Scenario,
  type ChannelDef,
  type DifficultyConfig,
  type Stakeholder,
  type DeliveredMessage,
  type ResolvedDecision,
  type Choice,
  DIFFICULTIES,
} from './types';
import { StateManager } from './StateManager';
import { EventScheduler } from './EventScheduler';
import { EscalationManager } from './EscalationManager';
import { StaticContentProvider } from './ContentProvider';
import type { ContentProvider } from './ContentProvider';
import { SeededRandom } from './SeededRandom';

export class GameEngine {
  private stateManager: StateManager;
  private scheduler: EventScheduler;
  private escalationManager: EscalationManager;
  private contentProvider: ContentProvider;
  private difficulty: DifficultyConfig;
  private scenario: Scenario;
  private stakeholders: Stakeholder[];
  private channels: ChannelDef[];
  private startTime: number = 0;
  private seed: number;

  constructor(
    scenario: Scenario,
    difficulty: DifficultyConfig = DIFFICULTIES.senior,
    seed?: number
  ) {
    this.seed = seed ?? Date.now();
    this.scenario = scenario;
    this.difficulty = difficulty;
    this.contentProvider = new StaticContentProvider(scenario, this.seed);
    this.stakeholders = this.contentProvider.getStakeholders();
    this.channels = this.contentProvider.getChannels();

    this.stateManager = new StateManager(scenario.initialState);

    const resolvedEvents = this.contentProvider.getEvents();
    const ambientEvents = this.materializeAmbientPools(scenario);
    this.scheduler = new EventScheduler([...resolvedEvents, ...ambientEvents], difficulty);

    this.escalationManager = new EscalationManager(
      difficulty,
      this.scheduler,
      this.stakeholders
    );
  }

  start(): GameState {
    this.startTime = Date.now();
    this.stateManager.setPhase('active');

    if (this.scenario.channels.length > 0) {
      this.stateManager.setActiveChannel(this.scenario.channels[0].id);
    }

    return this.stateManager.getState();
  }

  /**
   * Called on every game loop tick (~100ms).
   * Returns actions that the UI should process.
   */
  tick(elapsed: number): EngineAction[] {
    if (this.stateManager.getState().phase !== 'active') return [];

    this.stateManager.setClock(elapsed);
    const state = this.stateManager.getState();

    // Check end condition
    if (this.shouldEnd(elapsed)) {
      this.stateManager.setPhase('review');
      return [{ type: 'end_game' }];
    }

    const actions: EngineAction[] = [];

    // 1. Check scheduler for new events
    const schedulerActions = this.scheduler.tick(state, elapsed);
    actions.push(...schedulerActions);

    // 2. Check escalations for timed-out decisions
    const escalationActions = this.escalationManager.checkEscalations(
      state,
      elapsed
    );
    actions.push(...escalationActions);

    // 3. Process all actions to update state
    this.processActions(actions);

    return actions;
  }

  /**
   * Player resolves a decision by selecting a choice.
   * If playerText is provided, it replaces the choice's canned message in the chat.
   */
  resolve(decisionId: string, choiceId: string, playerText?: string): EngineAction[] {
    const pending = this.stateManager.getPendingDecision(decisionId);
    if (!pending) return [];

    const choice = pending.choices.find((c) => c.id === choiceId);
    if (!choice) return [];

    const actions: EngineAction[] = [];
    const elapsed = this.stateManager.getState().clock;

    // Record the resolution
    const resolved: ResolvedDecision = {
      decisionId,
      choiceId,
      resolvedAt: elapsed,
      effects: choice.effects,
      tags: choice.effects.map((e) => e.tag),
      wasDefer: choice.isDefer ?? false,
      contradicts: choice.contradicts ?? null,
    };
    this.stateManager.addResolvedDecision(resolved);

    // Apply state effects
    for (const effect of choice.effects) {
      this.stateManager.applyEffect(effect);
      actions.push({
        type: 'update_state',
        variable: effect.variable,
        delta: effect.delta,
        tag: effect.tag,
      });
    }

    // Deliver the player's message
    const playerMessage: DeliveredMessage = {
      id: `player-${decisionId}-${choiceId}`,
      eventId: pending.eventId,
      channel: pending.channel,
      from: 'player',
      content: playerText || choice.message,
      timestamp: elapsed,
      mentionsPlayer: false,
      contextValue: null,
      isPlayerMessage: true,
    };
    this.stateManager.addMessage(playerMessage);
    actions.push({ type: 'deliver_message', message: playerMessage });

    // Remove the pending decision
    this.stateManager.removePendingDecision(decisionId);
    actions.push({ type: 'close_decision', decisionId });

    // Trigger follow-up events
    if (choice.triggers) {
      for (const triggerId of choice.triggers) {
        const event = this.scheduler.getEvent(triggerId);
        if (event) {
          // Override triggerAt to fire relative to now
          this.scheduler.addEvent({
            ...event,
            triggerAt: undefined,
            triggerAfter: {
              eventId: pending.eventId,
              delay: 0,
            },
          });
        }
      }
    }

    return actions;
  }

  addFreeformMessage(channel: string, content: string): void {
    const elapsed = this.stateManager.getState().clock;
    const message: DeliveredMessage = {
      id: `freeform-${elapsed}-${Math.random().toString(36).slice(2, 6)}`,
      eventId: 'freeform',
      channel,
      from: 'player',
      content,
      timestamp: elapsed,
      mentionsPlayer: false,
      contextValue: null,
      isPlayerMessage: true,
    };
    this.stateManager.addMessage(message);
  }

  switchChannel(channelId: string): void {
    this.stateManager.setActiveChannel(channelId);
  }

  getState(): GameState {
    return this.stateManager.snapshot();
  }

  getStakeholders(): Stakeholder[] {
    return this.stakeholders;
  }

  getScenario(): Scenario {
    return this.scenario;
  }

  getChannels(): ChannelDef[] {
    return this.channels;
  }

  getDifficulty(): DifficultyConfig {
    return this.difficulty;
  }

  getSeed(): number {
    return this.seed;
  }

  isComplete(): boolean {
    return this.stateManager.getState().phase === 'review';
  }

  private materializeAmbientPools(scenario: Scenario): GameEvent[] {
    const rng = new SeededRandom(this.seed + 1);
    return scenario.ambientPools.map((pool) => {
      const variant = rng.pick(pool.variants);
      const triggerAt = rng.int(pool.window.earliest, pool.window.latest);
      return {
        id: `ambient-${pool.slotId}`,
        triggerAt,
        channel: pool.channel,
        messages: [{
          ...variant,
          content: this.contentProvider.resolveTemplate(variant.content, this.stakeholders),
        }],
        priority: 'ambient' as const,
      };
    });
  }

  private shouldEnd(elapsed: number): boolean {
    const endCondition = this.scenario.endCondition;
    if (endCondition.type === 'clock') {
      return elapsed >= endCondition.at * this.difficulty.timingScale;
    }
    // all_events_resolved: check if all non-conditional events have been delivered
    // and no pending decisions remain
    const state = this.stateManager.getState();
    const allEventsDelivered = this.scenario.events
      .filter((e) => !e.condition)
      .every((e) => state.deliveredEvents.includes(e.id));
    return allEventsDelivered && state.pendingDecisions.length === 0;
  }

  private processActions(actions: EngineAction[]): void {
    for (const action of actions) {
      switch (action.type) {
        case 'deliver_message':
          this.stateManager.addMessage(action.message);
          this.stateManager.markEventDelivered(action.message.eventId);
          break;
        case 'present_decision':
          this.stateManager.addPendingDecision(action.decision);
          break;
        case 'update_state':
          this.stateManager.applyEffect({
            variable: action.variable,
            delta: action.delta,
            tag: action.tag,
          });
          break;
        case 'close_decision':
          this.stateManager.removePendingDecision(action.decisionId);
          break;
        case 'auto_resolve':
          this.stateManager.addResolvedDecision({
            decisionId: action.decisionId,
            choiceId: null,
            resolvedAt: this.stateManager.getState().clock,
            effects: [],
            tags: ['auto-resolved'],
            wasDefer: false,
            contradicts: null,
          });
          break;
        case 'end_game':
          this.stateManager.setPhase('review');
          break;
      }
    }
  }
}
