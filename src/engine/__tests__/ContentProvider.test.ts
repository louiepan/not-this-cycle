import { describe, it, expect } from 'vitest';
import { StaticContentProvider } from '../ContentProvider';
import type { Scenario } from '../types';

const MINIMAL_SCENARIO: Scenario = {
  id: 'minimal',
  title: 'Minimal',
  premise: 'Minimal',
  durationTarget: 60000,
  worldTemplate: {
    templateId: 'minimal-world',
    companyNamePool: ['Forma', 'Plinth', 'Cadence', 'Vellum', 'Helix'],
    teamNamePool: ['Growth Platform', 'Activation', 'Lifecycle'],
    predecessorContextPool: [
      'The previous PM rage-quit on a Tuesday.',
      'The previous PM was promoted out, allegedly.',
    ],
    hqAddressPool: [
      '1 Test Plaza · San Francisco, CA',
      '2 Test Plaza · San Francisco, CA',
    ],
    productDescription: 'workflow software',
    stage: 'Series B',
    annualThemes: ['Move upmarket'],
    boardPressure: 'Board wants growth.',
    teamCharter: 'Owns onboarding.',
    mandate: 'Unblock the roadmap.',
    successCriteria: ['Stay credible.'],
    successCriteriaFooter: 'No promotion this cycle.',
  },
  stakeholders: [
    {
      id: 'the-vp',
      templateId: 'the-vp',
      role: 'VP of Product',
      seniority: 'vp',
      statusEmoji: '🎯',
      statusText: 'In meetings',
      personality: {
        mbtiType: 'ENTJ',
        enneagramType: 3,
        enneagramWing: 4,
        stressDirection: 9,
        coreFear: 'Being irrelevant',
        coreDesire: 'Achievement',
        communicationStyle: 'Direct',
        voiceRegister: 'Direct.',
        voiceExamples: ['Make it happen.'],
        pushBackLines: ['Specifically?'],
      },
      mechanics: {
        patience: 0.5,
        directness: 0.9,
        conflictStyle: 'confront',
        politicalAwareness: 0.9,
        escalationPattern: 'go-public',
      },
      namePool: [
        { firstName: 'Sarah', lastName: 'Chen' },
        { firstName: 'Marcus', lastName: 'Wright' },
      ],
    },
  ],
  channels: [{ id: 'general', name: '#general', type: 'channel' }],
  events: [],
  ambientPools: [],
  initialState: {},
  endCondition: { type: 'clock', at: 60000 },
};

describe('StaticContentProvider — world resolution', () => {
  it('resolves a world with all fields from pools', () => {
    const provider = new StaticContentProvider(MINIMAL_SCENARIO, 42);
    const world = provider.getWorld();

    expect(MINIMAL_SCENARIO.worldTemplate.companyNamePool).toContain(world.companyName);
    expect(MINIMAL_SCENARIO.worldTemplate.teamNamePool).toContain(world.teamName);
    expect(MINIMAL_SCENARIO.worldTemplate.predecessorContextPool).toContain(world.predecessorContext);
    expect(world.templateId).toBe('minimal-world');
  });

  it('produces the same world for the same seed', () => {
    const a = new StaticContentProvider(MINIMAL_SCENARIO, 42).getWorld();
    const b = new StaticContentProvider(MINIMAL_SCENARIO, 42).getWorld();
    expect(a).toEqual(b);
  });

  it('produces different worlds for different seeds (probabilistic with rich pools)', () => {
    const a = new StaticContentProvider(MINIMAL_SCENARIO, 1).getWorld();
    const b = new StaticContentProvider(MINIMAL_SCENARIO, 9_999_999).getWorld();
    // At least one field should differ across two distant seeds against these pools
    const same =
      a.companyName === b.companyName &&
      a.teamName === b.teamName &&
      a.predecessorContext === b.predecessorContext;
    expect(same).toBe(false);
  });
});

describe('StaticContentProvider — resolveTemplate', () => {
  it('resolves stakeholder firstName/lastName/name/role', () => {
    const provider = new StaticContentProvider(MINIMAL_SCENARIO, 42);
    const stakeholders = provider.getStakeholders();
    const vp = stakeholders[0];

    expect(provider.resolveTemplate('{{the-vp.firstName}}', stakeholders)).toBe(vp.name.split(' ')[0]);
    expect(provider.resolveTemplate('{{the-vp.lastName}}', stakeholders)).toBe(
      vp.name.split(' ').slice(1).join(' ')
    );
    expect(provider.resolveTemplate('{{the-vp.name}}', stakeholders)).toBe(vp.name);
    expect(provider.resolveTemplate('{{the-vp.role}}', stakeholders)).toBe('VP of Product');
  });

  it('resolves world.companyName / teamName / predecessorContext', () => {
    const provider = new StaticContentProvider(MINIMAL_SCENARIO, 42);
    const stakeholders = provider.getStakeholders();
    const world = provider.getWorld();

    expect(provider.resolveTemplate('{{world.companyName}}', stakeholders)).toBe(world.companyName);
    expect(provider.resolveTemplate('{{world.teamName}}', stakeholders)).toBe(world.teamName);
    expect(provider.resolveTemplate('{{world.predecessorContext}}', stakeholders)).toBe(
      world.predecessorContext
    );
  });

  it('mixes stakeholder and world references in one string', () => {
    const provider = new StaticContentProvider(MINIMAL_SCENARIO, 42);
    const stakeholders = provider.getStakeholders();
    const world = provider.getWorld();
    const vp = stakeholders[0];

    const out = provider.resolveTemplate(
      'Welcome to {{world.companyName}}, {{the-vp.firstName}}.',
      stakeholders
    );
    expect(out).toBe(`Welcome to ${world.companyName}, ${vp.name.split(' ')[0]}.`);
  });

  it('leaves unknown ids and unknown fields untouched', () => {
    const provider = new StaticContentProvider(MINIMAL_SCENARIO, 42);
    const stakeholders = provider.getStakeholders();

    expect(provider.resolveTemplate('{{unknown-id.firstName}}', stakeholders)).toBe(
      '{{unknown-id.firstName}}'
    );
    expect(provider.resolveTemplate('{{world.notAField}}', stakeholders)).toBe('{{world.notAField}}');
    expect(provider.resolveTemplate('{{the-vp.notAField}}', stakeholders)).toBe('{{the-vp.notAField}}');
  });
});
