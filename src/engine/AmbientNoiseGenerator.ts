import type {
  ChannelDef,
  DifficultyConfig,
  EventMessage,
  GameEvent,
  Scenario,
  Stakeholder,
} from './types';
import { SeededRandom } from './SeededRandom';

type ChannelTone = 'coordination' | 'status' | 'process' | 'social';

interface ChannelPattern {
  channelIds: string[];
  tones: ChannelTone[];
}

const CHANNEL_PATTERNS: ChannelPattern[] = [
  {
    channelIds: ['planning-war-room', 'product-strategy'],
    tones: ['coordination', 'status', 'process'],
  },
  {
    channelIds: ['eng-team'],
    tones: ['status', 'process'],
  },
  {
    channelIds: ['design-sync'],
    tones: ['coordination', 'social'],
  },
  {
    channelIds: ['dm-manager', 'dm-staff-eng', 'dm-design-lead'],
    tones: ['coordination', 'status'],
  },
];

const OPENERS = [
  'Quick check',
  'Flagging this here',
  'Circling back',
  'Small thing',
  'Not blocking yet',
  'Re-sharing for visibility',
  'Probably overthinking this',
  'Sanity check',
];

const COORDINATION_BODIES = [
  'who is actually owning the final narrative for this',
  'can we get to one version of the story before this goes upward',
  'I am seeing slightly different assumptions in three places',
  'we may want one source of truth before someone forwards the wrong deck',
  'it would help to know whether this is a PM call or an eng call',
  'I do not want to present two different answers to the same question',
];

const STATUS_BODIES = [
  'I told leadership we were directionally aligned, so if that changed please say it gently',
  'there is now a tracker for the tracker, which feels like a signal',
  'I got asked for a status update without context, which is usually how these things begin',
  'we are close to calling this final in the way only Q4 planning can be',
  'someone asked me if this is launch-critical and I did a long pause',
  'I would love a sentence I can reuse when people ask where this landed',
];

const PROCESS_BODIES = [
  'can everyone please use the latest template because the previous latest template is no longer latest',
  'if we are escalating this, can we at least decide what version number we are escalating',
  'the deck comments and the doc comments are now disagreeing with each other',
  'I would prefer not to create another sync about this, but I can feel the meeting forming',
  'before this gets socialized more broadly, can someone confirm we are not inventing a new process again',
  'I am not saying we need a mini working session, I am saying one is already happening to us',
];

const SOCIAL_BODIES = [
  'dropping updated mocks here in case anyone wants to emotionally prepare before review',
  'the empty states are now in a place where I can defend them in public',
  'I know this is not the main problem, but the current copy sounds like legal wrote it in a tunnel',
  'shared a version that feels less like a punishment to users',
  'please admire how much calmer this looks than the planning thread feels',
];

const TAGS = [
  'for visibility',
  'before this gets weird',
  'so nobody is surprised later',
  'because I suspect this will resurface',
  'before someone asks in a larger room',
  'while we still have plausible deniability',
];

const FOLLOW_UPS = [
  'Works for me.',
  'I can live with that framing.',
  'This feels mostly true.',
  'Adding a light plus one.',
  'I would like that to be true by the time this reaches execs.',
  'I support this in a bounded way.',
];

function uniqueById(events: GameEvent[]): GameEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class AmbientNoiseGenerator {
  private scenario: Scenario;
  private stakeholders: Stakeholder[];
  private channels: ChannelDef[];
  private difficulty: DifficultyConfig;
  private rng: SeededRandom;

  constructor(
    scenario: Scenario,
    stakeholders: Stakeholder[],
    channels: ChannelDef[],
    difficulty: DifficultyConfig,
    seed: number
  ) {
    this.scenario = scenario;
    this.stakeholders = stakeholders;
    this.channels = channels;
    this.difficulty = difficulty;
    this.rng = new SeededRandom(seed);
  }

  generate(): GameEvent[] {
    const generatedCount = this.getGeneratedEventCount();
    const events: GameEvent[] = [];

    for (let index = 0; index < generatedCount; index += 1) {
      const event = this.createEvent(index);
      if (event) {
        events.push(event);
      }
    }

    return uniqueById(events);
  }

  private getGeneratedEventCount(): number {
    const minutes = this.scenario.durationTarget / 60000;
    const baseCount = Math.round(minutes * 4);
    const noiseBonus = Math.round(this.difficulty.ambientNoiseLevel * 10);
    const concurrencyBonus = Math.max(0, this.difficulty.concurrentConversations - 2);
    return clamp(baseCount + noiseBonus + concurrencyBonus, 8, 22);
  }

  private createEvent(index: number): GameEvent | null {
    const channel = this.pickChannel();
    if (!channel) return null;

    const primarySpeaker = this.pickSpeakerForChannel(channel.id);
    if (!primarySpeaker) return null;

    const tone = this.pickToneForChannel(channel.id);
    const primaryMessage = this.createPrimaryMessage(index, primarySpeaker.id, tone);
    const messages: EventMessage[] = [primaryMessage];

    const shouldThread = this.rng.next() < 0.35;
    if (shouldThread) {
      const replier = this.pickReplySpeaker(channel.id, primarySpeaker.id);
      if (replier) {
        messages.push({
          id: `generated-ambient-${index}-reply`,
          from: replier.id,
          content: this.rng.pick(FOLLOW_UPS),
          delay: this.rng.int(5000, 16000),
          mentionsPlayer: false,
          contextValue: 'ambient',
        });
      }
    }

    const earliest = Math.floor((index / (this.getGeneratedEventCount() + 1)) * this.scenario.durationTarget);
    const jitter = Math.floor(this.scenario.durationTarget / (this.getGeneratedEventCount() + 2));
    const triggerAt = clamp(
      earliest + this.rng.int(3000, Math.max(4000, jitter)),
      2000,
      this.scenario.durationTarget - 8000
    );

    return {
      id: `generated-ambient-${index}`,
      triggerAt,
      channel: channel.id,
      messages,
      priority: 'ambient',
    };
  }

  private createPrimaryMessage(index: number, from: string, tone: ChannelTone): EventMessage {
    const body = this.pickBody(tone);
    const opener = this.rng.pick(OPENERS);
    const tag = this.rng.next() < 0.65 ? ` ${this.rng.pick(TAGS)}.` : '.';
    const mentionsPlayer = this.shouldMentionPlayer(tone);

    return {
      id: `generated-ambient-${index}-primary`,
      from,
      content: `${opener}: ${body}${tag}`,
      delay: 0,
      mentionsPlayer,
      contextValue: mentionsPlayer ? 'optional' : 'noise',
    };
  }

  private pickBody(tone: ChannelTone): string {
    switch (tone) {
      case 'coordination':
        return this.rng.pick(COORDINATION_BODIES);
      case 'status':
        return this.rng.pick(STATUS_BODIES);
      case 'process':
        return this.rng.pick(PROCESS_BODIES);
      case 'social':
        return this.rng.pick(SOCIAL_BODIES);
    }
  }

  private shouldMentionPlayer(tone: ChannelTone): boolean {
    const mentionRate =
      tone === 'coordination'
        ? 0.18
        : tone === 'status'
          ? 0.08
          : 0.03;
    return this.rng.next() < mentionRate;
  }

  private pickChannel(): ChannelDef | null {
    const eligible = this.channels.filter((channel) =>
      CHANNEL_PATTERNS.some((pattern) => pattern.channelIds.includes(channel.id))
    );
    if (eligible.length === 0) return null;
    return this.rng.pick(eligible);
  }

  private pickToneForChannel(channelId: string): ChannelTone {
    const pattern = CHANNEL_PATTERNS.find((item) => item.channelIds.includes(channelId));
    return pattern ? this.rng.pick(pattern.tones) : 'coordination';
  }

  private pickSpeakerForChannel(channelId: string): Stakeholder | null {
    const allowed = this.getEligibleSpeakers(channelId);

    if (allowed.length === 0) return null;
    return this.rng.pick(allowed);
  }

  private pickReplySpeaker(channelId: string, primarySpeakerId: string): Stakeholder | null {
    const allowed = this.getEligibleSpeakers(channelId).filter(
      (stakeholder) => stakeholder.id !== primarySpeakerId
    );
    if (allowed.length === 0) return null;
    return this.rng.pick(allowed);
  }

  private getEligibleSpeakers(channelId: string): Stakeholder[] {
    return this.stakeholders.filter((stakeholder) => {
      if (channelId === 'eng-team') return stakeholder.id !== 'the-design-lead';
      if (channelId === 'design-sync') return stakeholder.id !== 'the-staff-eng';
      if (channelId === 'dm-manager') return stakeholder.id === 'the-manager';
      if (channelId === 'dm-staff-eng') return stakeholder.id === 'the-staff-eng';
      if (channelId === 'dm-design-lead') return stakeholder.id === 'the-design-lead';
      return true;
    });
  }
}
