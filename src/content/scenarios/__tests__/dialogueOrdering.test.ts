import { describe, expect, it } from 'vitest';
import { Q4_PLANNING_SCENARIO } from '../q4-planning';
import type { GameEvent } from '@/engine/types';

const SCENARIO = Q4_PLANNING_SCENARIO;

function eventsByChannel(events: GameEvent[]): Map<string, GameEvent[]> {
  const map = new Map<string, GameEvent[]>();
  for (const event of events) {
    const bucket = map.get(event.channel) ?? [];
    bucket.push(event);
    map.set(event.channel, bucket);
  }
  return map;
}

function findEvent(id: string): GameEvent {
  const event = SCENARIO.events.find((candidate) => candidate.id === id);
  if (!event) throw new Error(`Missing event ${id}`);
  return event;
}

describe('q4-planning dialogue ordering', () => {
  it('greets, welcomes, re-grounds, and points to pins — in that exact order in the manager DM', () => {
    const event = findEvent('evt-history-dm-manager');
    const ids = event.messages.map((message) => message.id);
    expect(ids).toEqual([
      'msg-dm-mgr-morning',
      'msg-dm-mgr-welcome',
      'msg-dm-mgr-regrounding',
      'msg-dm-mgr-pinned',
    ]);
  });

  it('plays manager DM beats with monotonically non-decreasing delays', () => {
    const event = findEvent('evt-history-dm-manager');
    const delays = event.messages.map((message) => message.delay);
    const sorted = [...delays].sort((a, b) => a - b);
    expect(delays).toEqual(sorted);
  });

  it('keeps reactive beats out of the morning DM event', () => {
    const event = findEvent('evt-history-dm-manager');
    const REACTIVE_PHRASES = [
      'not thrilled',
      'visibility has a half-life',
      'revenue numbers hit',
    ];
    for (const message of event.messages) {
      for (const phrase of REACTIVE_PHRASES) {
        expect(
          message.content.toLowerCase().includes(phrase.toLowerCase()),
          `morning DM ${message.id} must not contain reactive phrase "${phrase}"`
        ).toBe(false);
      }
    }
  });

  it('confines the "heads up" beat to the data-reaction event, and that event is only reachable via a choice trigger', () => {
    const reactiveEvent = findEvent('evt-vp-data-reaction');
    expect(reactiveEvent.triggerAt).toBeUndefined();
    expect(reactiveEvent.triggerAfter).toBeUndefined();

    const triggeringChoices = SCENARIO.events
      .flatMap((event) => event.decision?.choices ?? [])
      .filter((choice) => (choice.triggers ?? []).includes('evt-vp-data-reaction'));
    expect(triggeringChoices.length).toBeGreaterThan(0);

    const headsUpEvents = SCENARIO.events.filter((event) =>
      event.messages.some((message) =>
        message.content.toLowerCase().includes('was not thrilled')
      )
    );
    expect(headsUpEvents.map((event) => event.id)).toEqual(['evt-vp-data-reaction']);
  });

  it('only allows beats with no triggerAt/triggerAfter when something explicitly triggers them', () => {
    const choiceTriggers = SCENARIO.events
      .flatMap((event) => event.decision?.choices ?? [])
      .flatMap((choice) => choice.triggers ?? []);
    const escalationTriggers = SCENARIO.events
      .flatMap((event) => event.decision?.escalation?.stages ?? [])
      .map((stage) => stage.eventId);
    const triggeredIds = new Set([...choiceTriggers, ...escalationTriggers]);
    const orphans: string[] = [];
    for (const event of SCENARIO.events) {
      if (event.triggerAt === undefined && event.triggerAfter === undefined) {
        if (!triggeredIds.has(event.id)) {
          orphans.push(event.id);
        }
      }
    }
    expect(orphans).toEqual([]);
  });

  it('orders authored events on the same channel by trigger time (when both are time-anchored)', () => {
    const grouped = eventsByChannel(SCENARIO.events);
    for (const [channel, events] of grouped) {
      const timed = events
        .filter((event) => event.triggerAt !== undefined)
        .map((event) => ({ id: event.id, at: event.triggerAt as number }));
      const sorted = [...timed].sort((a, b) => a.at - b.at);
      expect(
        timed.map((entry) => entry.id),
        `channel ${channel} events are not authored in chronological order`
      ).toEqual(sorted.map((entry) => entry.id));
    }
  });

  it('emits each DM event from a single stakeholder so message grouping stays coherent', () => {
    const dmChannels = new Set(
      SCENARIO.channels.filter((channel) => channel.type === 'dm').map((channel) => channel.id)
    );
    for (const event of SCENARIO.events) {
      if (!dmChannels.has(event.channel)) continue;
      const senders = new Set(event.messages.map((message) => message.from));
      expect(
        senders.size,
        `DM event ${event.id} mixes senders ${[...senders].join(', ')}`
      ).toBeLessThanOrEqual(1);
    }
  });
});
