import {
  type Scenario,
  type Stakeholder,
  type StakeholderTemplate,
  type ChannelDef,
  type GameEvent,
  type DifficultyConfig,
} from './types';
import { AmbientNoiseGenerator } from './AmbientNoiseGenerator';
import { SeededRandom } from './SeededRandom';

export interface ContentProvider {
  getScenario(): Scenario;
  getStakeholders(): Stakeholder[];
  getChannels(): ChannelDef[];
  getEvents(): GameEvent[];
  getAmbientEvents(difficulty: DifficultyConfig): GameEvent[];
  resolveTemplate(template: string, stakeholders: Stakeholder[]): string;
}

/**
 * MVP content provider — reads from static scenario data.
 * Resolves stakeholder names from name pools using the session seed.
 * Resolves template variables in message content.
 */
export class StaticContentProvider implements ContentProvider {
  private scenario: Scenario;
  private stakeholders: Stakeholder[];
  private templateMap: Map<string, Stakeholder>;
  private rng: SeededRandom;
  private seed: number;

  constructor(scenario: Scenario, seed: number) {
    this.scenario = scenario;
    this.seed = seed;
    this.rng = new SeededRandom(seed);
    this.stakeholders = this.resolveStakeholders(scenario.stakeholders);
    this.templateMap = new Map(
      this.stakeholders.map((s) => [s.id, s])
    );
  }

  getScenario(): Scenario {
    return this.scenario;
  }

  getStakeholders(): Stakeholder[] {
    return this.stakeholders;
  }

  getChannels(): ChannelDef[] {
    return this.scenario.channels.map((ch) => ({
      ...ch,
      name: this.resolveTemplate(ch.name, this.stakeholders),
      description: ch.description
        ? this.resolveTemplate(ch.description, this.stakeholders)
        : undefined,
    }));
  }

  getEvents(): GameEvent[] {
    return this.scenario.events.map((event) => ({
      ...event,
      messages: event.messages.map((msg) => ({
        ...msg,
        content: this.resolveTemplate(msg.content, this.stakeholders),
      })),
      decision: event.decision
        ? {
            ...event.decision,
            choices: event.decision.choices.map((choice) => ({
              ...choice,
              label: this.resolveTemplate(choice.label, this.stakeholders),
              message: this.resolveTemplate(choice.message, this.stakeholders),
              reactions: choice.reactions?.map((reaction) => ({
                ...reaction,
                content: this.resolveTemplate(reaction.content, this.stakeholders),
              })),
            })),
          }
        : undefined,
    }));
  }

  getAmbientEvents(difficulty: DifficultyConfig): GameEvent[] {
    const authored = this.getResolvedAmbientPoolEvents(difficulty);
    const generated = new AmbientNoiseGenerator(
      this.scenario,
      this.stakeholders,
      this.getChannels(),
      difficulty,
      this.seed + 1000
    ).generate();

    return [...authored, ...generated];
  }

  resolveTemplate(template: string, stakeholders: Stakeholder[]): string {
    return template.replace(/\{\{(\w[\w-]*)\.(firstName|lastName|name|role)\}\}/g,
      (match, id, field) => {
        const stakeholder = this.templateMap.get(id) ||
          stakeholders.find((s) => s.id === id);
        if (!stakeholder) return match;

        switch (field) {
          case 'firstName': return stakeholder.name.split(' ')[0];
          case 'lastName': return stakeholder.name.split(' ').slice(1).join(' ');
          case 'name': return stakeholder.name;
          case 'role': return stakeholder.role;
          default: return match;
        }
      }
    );
  }

  private resolveStakeholders(templates: StakeholderTemplate[]): Stakeholder[] {
    return templates.map((template) => {
      const name = this.rng.pick(template.namePool);
      return {
        ...template,
        name: `${name.firstName} ${name.lastName}`,
      };
    });
  }

  private getResolvedAmbientPoolEvents(difficulty: DifficultyConfig): GameEvent[] {
    const rng = new SeededRandom(this.seed + 1);
    const selectedPools = this.scenario.ambientPools.filter(
      () => rng.next() < difficulty.ambientNoiseLevel
    );
    const pools = selectedPools.length > 0 ? selectedPools : this.scenario.ambientPools.slice(0, 1);

    return pools.map((pool) => {
      const variant = rng.pick(pool.variants);
      const triggerAt = rng.int(pool.window.earliest, pool.window.latest);
      return {
        id: `ambient-${pool.slotId}`,
        triggerAt,
        channel: pool.channel,
        messages: [{
          ...variant,
          content: this.resolveTemplate(variant.content, this.stakeholders),
        }],
        priority: 'ambient' as const,
      };
    });
  }
}
