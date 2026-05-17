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

const MANAGER_DM_VARIANT_IDS = [
  'evt-history-dm-manager-junior',
  'evt-history-dm-manager-senior',
  'evt-history-dm-manager-principal',
] as const;

describe('q4-planning dialogue ordering', () => {
  it.each(MANAGER_DM_VARIANT_IDS)(
    'welcomes, then morning aside, re-grounds, and points — in that exact order (%s)',
    (variantId) => {
      const event = findEvent(variantId);
      const ids = event.messages.map((message) => message.id);
      expect(ids).toEqual([
        'msg-dm-mgr-welcome',
        'msg-dm-mgr-morning',
        'msg-dm-mgr-regrounding',
        'msg-dm-mgr-pointer',
      ]);
    }
  );

  it.each(MANAGER_DM_VARIANT_IDS)(
    'plays manager DM beats with monotonically non-decreasing delays (%s)',
    (variantId) => {
      const event = findEvent(variantId);
      const delays = event.messages.map((message) => message.delay);
      const sorted = [...delays].sort((a, b) => a - b);
      expect(delays).toEqual(sorted);
    }
  );

  it.each(MANAGER_DM_VARIANT_IDS)(
    'keeps reactive beats out of the morning DM event (%s)',
    (variantId) => {
      const event = findEvent(variantId);
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
    }
  );

  it('gates each manager DM variant to exactly one difficulty', () => {
    const variants = MANAGER_DM_VARIANT_IDS.map(findEvent);
    const allDifficulties = variants.flatMap((event) => event.difficulty ?? []);
    expect(allDifficulties.sort()).toEqual(['junior', 'principal', 'senior']);
    for (const event of variants) {
      expect(event.difficulty, `${event.id} must be difficulty-gated`).toBeDefined();
      expect(event.difficulty?.length, `${event.id} should gate to one difficulty`).toBe(1);
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

  it('lands the player on a read-only #announcements channel with a CEO welcome as the last message', () => {
    expect(SCENARIO.initialActiveChannel).toBe('announcements');

    const announcements = SCENARIO.channels.find((channel) => channel.id === 'announcements');
    expect(announcements).toBeDefined();
    expect(announcements?.readOnly).toBe(true);

    const event = findEvent('evt-history-announcements');
    expect(event.channel).toBe('announcements');
    expect(event.triggerAt).toBe(0);
    expect(event.messages.length).toBeGreaterThanOrEqual(10);

    const allowedSenders = new Set([
      'the-ceo',
      'the-ceo-chief-of-staff',
      'the-cfo',
    ]);
    for (const message of event.messages) {
      expect(allowedSenders.has(message.from)).toBe(true);
    }

    const welcome = event.messages[event.messages.length - 1];
    expect(welcome.from).toBe('the-ceo');
    expect(welcome.content).toContain('{{player.firstName}}');
    expect(welcome.content).toContain('{{player.title}}');
    expect(welcome.content).toContain('{{world.teamName}}');
    // The welcome should @-mention the player, the reporting manager, and
    // the partnering VP so they all see notifications, and should @channel
    // to broadcast it like a real post.
    expect(welcome.content).toMatch(/@\{\{player\.(firstName|name)\}\}/);
    expect(welcome.content).toMatch(/@\{\{the-manager\.(firstName|name)\}\}/);
    expect(welcome.content).toMatch(/@\{\{the-vp\.(firstName|name)\}\}/);
    expect(welcome.content).toContain('@channel');
  });

  it('registers the new exec stakeholders so the announcements senders resolve', () => {
    const stakeholderIds = new Set(SCENARIO.stakeholders.map((s) => s.id));
    expect(stakeholderIds.has('the-ceo')).toBe(true);
    expect(stakeholderIds.has('the-ceo-chief-of-staff')).toBe(true);
    expect(stakeholderIds.has('the-cfo')).toBe(true);
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
