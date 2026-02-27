import {
  type GameState,
  type GameVariables,
  type VariableName,
  type StateEffect,
  type DeliveredMessage,
  type PendingDecision,
  type ResolvedDecision,
  type GamePhase,
  INITIAL_VARIABLES,
} from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class StateManager {
  private state: GameState;

  constructor(initialOverrides: Partial<GameVariables> = {}) {
    this.state = {
      variables: { ...INITIAL_VARIABLES, ...initialOverrides },
      clock: 0,
      phase: 'intro',
      deliveredEvents: [],
      pendingDecisions: [],
      resolvedDecisions: [],
      messages: [],
      unreadCounts: {},
      mentionCounts: {},
      activeChannel: '',
    };
  }

  getState(): GameState {
    return this.state;
  }

  getVariable(name: VariableName): number {
    return this.state.variables[name];
  }

  setClock(ms: number): void {
    this.state.clock = ms;
  }

  setPhase(phase: GamePhase): void {
    this.state.phase = phase;
  }

  setActiveChannel(channelId: string): void {
    this.state.activeChannel = channelId;
    this.state.unreadCounts[channelId] = 0;
    this.state.mentionCounts[channelId] = 0;
  }

  applyEffect(effect: StateEffect): void {
    const current = this.state.variables[effect.variable];
    this.state.variables[effect.variable] = clamp(current + effect.delta, 0, 100);
  }

  applyEffects(effects: StateEffect[]): void {
    for (const effect of effects) {
      this.applyEffect(effect);
    }
  }

  addMessage(message: DeliveredMessage): void {
    this.state.messages.push(message);

    if (message.channel !== this.state.activeChannel && !message.isPlayerMessage) {
      this.state.unreadCounts[message.channel] =
        (this.state.unreadCounts[message.channel] || 0) + 1;

      if (message.mentionsPlayer) {
        this.state.mentionCounts[message.channel] =
          (this.state.mentionCounts[message.channel] || 0) + 1;
      }
    }
  }

  markEventDelivered(eventId: string): void {
    if (!this.state.deliveredEvents.includes(eventId)) {
      this.state.deliveredEvents.push(eventId);
    }
  }

  addPendingDecision(decision: PendingDecision): void {
    this.state.pendingDecisions.push(decision);
  }

  removePendingDecision(decisionId: string): PendingDecision | undefined {
    const index = this.state.pendingDecisions.findIndex(
      (d) => d.decisionId === decisionId
    );
    if (index === -1) return undefined;
    return this.state.pendingDecisions.splice(index, 1)[0];
  }

  getPendingDecision(decisionId: string): PendingDecision | undefined {
    return this.state.pendingDecisions.find((d) => d.decisionId === decisionId);
  }

  getPendingDecisionForChannel(channel: string): PendingDecision | undefined {
    return this.state.pendingDecisions.find((d) => d.channel === channel);
  }

  addResolvedDecision(resolved: ResolvedDecision): void {
    this.state.resolvedDecisions.push(resolved);
  }

  isEventDelivered(eventId: string): boolean {
    return this.state.deliveredEvents.includes(eventId);
  }

  getMessagesForChannel(channel: string): DeliveredMessage[] {
    return this.state.messages.filter((m) => m.channel === channel);
  }

  checkCondition(
    variable: VariableName,
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte',
    value: number
  ): boolean {
    const current = this.state.variables[variable];
    switch (operator) {
      case 'gt': return current > value;
      case 'lt': return current < value;
      case 'eq': return current === value;
      case 'gte': return current >= value;
      case 'lte': return current <= value;
    }
  }

  snapshot(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }
}
