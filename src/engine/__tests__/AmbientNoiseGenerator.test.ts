import { describe, expect, it } from 'vitest';
import { AmbientNoiseGenerator } from '../AmbientNoiseGenerator';
import { StaticContentProvider } from '../ContentProvider';
import { DIFFICULTIES, type Scenario } from '../types';
import { Q4_PLANNING_SCENARIO } from '../../content/scenarios/q4-planning';

describe('AmbientNoiseGenerator', () => {
  function setup(scenario: Scenario = Q4_PLANNING_SCENARIO) {
    const provider = new StaticContentProvider(scenario, 123);
    return new AmbientNoiseGenerator(
      scenario,
      provider.getStakeholders(),
      provider.getChannels(),
      DIFFICULTIES.senior,
      456
    );
  }

  it('generates multiple ambient events for a session', () => {
    const events = setup().generate();

    expect(events.length).toBeGreaterThan(8);
    expect(events.every((event) => event.priority === 'ambient')).toBe(true);
  });

  it('keeps generated messages low-stakes and within the scenario window', () => {
    const events = setup().generate();

    for (const event of events) {
      expect(event.triggerAt).toBeDefined();
      expect(event.triggerAt!).toBeGreaterThanOrEqual(2000);
      expect(event.triggerAt!).toBeLessThan(Q4_PLANNING_SCENARIO.durationTarget);
      expect(event.decision).toBeUndefined();
      expect(event.messages.length).toBeGreaterThan(0);
    }
  });
});
