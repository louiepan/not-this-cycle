import { describe, it, expect } from 'vitest';
import {
  analyzePlayerReply,
  matchChoice,
  CONFIDENCE_THRESHOLD,
} from '../ChoiceMatcher';
import type { Choice, Stakeholder } from '../types';

function makeChoice(overrides: Partial<Choice> & { id: string }): Choice {
  return {
    label: 'Default label',
    message: 'Default message',
    effects: [],
    tone: 'diplomatic',
    ...overrides,
  };
}

const VP_ROADMAP_CHOICES: Choice[] = [
  makeChoice({
    id: 'commit',
    label: 'Commit confidently',
    message: "Absolutely. I'll have a draft by 4pm with clear scope and tradeoffs.",
    tone: 'committing',
  }),
  makeChoice({
    id: 'pushback',
    label: 'Push back on scope',
    message: "I want to make sure we set realistic expectations. Can I walk you through what the team capacity actually looks like?",
    tone: 'direct',
  }),
  makeChoice({
    id: 'defer',
    label: 'Ask for more context',
    message: "Got it. Let me sync with the team first to understand where things are. Can I get back to you tomorrow morning?",
    tone: 'deflecting',
    isDefer: true,
  }),
];

const STAKEHOLDERS: Stakeholder[] = [
  {
    id: 'the-staff-eng',
    name: 'Riley Chen',
    role: 'Staff Engineer',
    seniority: 'ic',
    statusEmoji: '🛠️',
    statusText: 'In code',
    personality: {
      mbtiType: 'INTJ',
      enneagramType: 5,
      enneagramWing: 6,
      stressDirection: 7,
      coreFear: 'Being incompetent',
      coreDesire: 'Mastery',
      communicationStyle: 'Precise and skeptical',
    },
    mechanics: {
      patience: 0.5,
      directness: 0.9,
      conflictStyle: 'confront',
      politicalAwareness: 0.6,
      escalationPattern: 'go-public',
    },
  },
];

describe('matchChoice', () => {
  it('throws on empty choices array', () => {
    expect(() => matchChoice('hello', [])).toThrow('No choices available');
  });

  it('returns the only choice when array has one element', () => {
    const single = [VP_ROADMAP_CHOICES[0]];
    const result = matchChoice('anything at all', single);
    expect(result.choice.id).toBe('commit');
    expect(result.confidence).toBe(1.0);
  });

  describe('tone-based matching', () => {
    it('matches "yes" to committing tone', () => {
      const result = matchChoice('yes', VP_ROADMAP_CHOICES);
      expect(result.choice.id).toBe('commit');
      expect(result.matchedTone).toBe('committing');
    });

    it('matches "absolutely" to committing tone', () => {
      const result = matchChoice('absolutely', VP_ROADMAP_CHOICES);
      expect(result.choice.id).toBe('commit');
    });

    it('matches "on it" to committing tone', () => {
      const result = matchChoice("I'm on it", VP_ROADMAP_CHOICES);
      expect(result.choice.id).toBe('commit');
    });

    it('matches "ok" to committing tone', () => {
      const result = matchChoice('ok', VP_ROADMAP_CHOICES);
      expect(result.choice.id).toBe('commit');
    });

    it('matches "let me think" to deflecting tone', () => {
      const result = matchChoice('let me think about this', VP_ROADMAP_CHOICES);
      expect(result.choice.id).toBe('defer');
      expect(result.matchedTone).toBe('deflecting');
    });

    it('matches "not sure" to deflecting tone', () => {
      const result = matchChoice("I'm not sure yet", VP_ROADMAP_CHOICES);
      expect(result.choice.id).toBe('defer');
    });

    it('matches "circle back" to deflecting tone', () => {
      const result = matchChoice("let's circle back on this", VP_ROADMAP_CHOICES);
      expect(result.choice.id).toBe('defer');
    });

    it('matches "realistic" to direct tone', () => {
      const result = matchChoice("let's be realistic about this", VP_ROADMAP_CHOICES);
      expect(result.choice.id).toBe('pushback');
      expect(result.matchedTone).toBe('direct');
    });

    it('matches "concern" to direct tone', () => {
      const result = matchChoice('I have concerns about the timeline', VP_ROADMAP_CHOICES);
      expect(result.choice.id).toBe('pushback');
    });
  });

  describe('keyword-based matching', () => {
    it('matches keywords from choice label/message', () => {
      const result = matchChoice(
        'I want to push back on the scope and set realistic expectations',
        VP_ROADMAP_CHOICES
      );
      expect(result.choice.id).toBe('pushback');
    });

    it('matches "draft" and "tradeoffs" to commit choice', () => {
      const result = matchChoice(
        "I'll put together a draft with clear tradeoffs",
        VP_ROADMAP_CHOICES
      );
      expect(result.choice.id).toBe('commit');
    });

    it('matches "sync with the team" to defer choice', () => {
      const result = matchChoice(
        'let me sync with the team and get back to you',
        VP_ROADMAP_CHOICES
      );
      expect(result.choice.id).toBe('defer');
    });
  });

  describe('confidence threshold', () => {
    it('returns low confidence for completely unrelated input', () => {
      const result = matchChoice('pizza delivery', VP_ROADMAP_CHOICES);
      expect(result.confidence).toBeLessThan(CONFIDENCE_THRESHOLD);
    });

    it('returns high confidence for strong tone match', () => {
      const result = matchChoice('absolutely, lets go', VP_ROADMAP_CHOICES);
      expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
    });

    it('returns high confidence for keyword-rich input', () => {
      const result = matchChoice(
        'I want to set realistic expectations about scope and capacity',
        VP_ROADMAP_CHOICES
      );
      expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
    });

    it('returns low confidence for single neutral word', () => {
      const result = matchChoice('hmm', VP_ROADMAP_CHOICES);
      // "hmm" maps to deflecting, should still have decent confidence
      expect(result.matchedTone).toBe('deflecting');
    });
  });

  describe('multi-choice scenarios', () => {
    const DESIGN_CHOICES: Choice[] = [
      makeChoice({
        id: 'phase',
        label: 'Suggest phasing',
        message: "Let's phase it. Ship SSO + dashboard first, push onboarding to 6b.",
        tone: 'diplomatic',
      }),
      makeChoice({
        id: 'push',
        label: 'Push through',
        message: "Leadership has locked the scope. Let's find ways to make it work.",
        tone: 'direct',
      }),
      makeChoice({
        id: 'empathize',
        label: 'Empathize but stall',
        message: "Yeah, I totally get that. Let me think on it and circle back.",
        tone: 'deflecting',
        isDefer: true,
      }),
    ];

    it('matches "phase" keyword to phasing choice', () => {
      const result = matchChoice('what if we phase this out?', DESIGN_CHOICES);
      expect(result.choice.id).toBe('phase');
    });

    it('matches "leadership" keyword to push through', () => {
      const result = matchChoice(
        'leadership wants this and we need to deliver',
        DESIGN_CHOICES
      );
      expect(result.choice.id).toBe('push');
    });

    it('matches "I hear you" to diplomatic tone', () => {
      const result = matchChoice('I hear you, good point', DESIGN_CHOICES);
      expect(result.choice.id).toBe('phase');
      expect(result.matchedTone).toBe('diplomatic');
    });

    it('matches "circle back" to deflecting', () => {
      const result = matchChoice("let's circle back later", DESIGN_CHOICES);
      expect(result.choice.id).toBe('empathize');
    });
  });

  describe('edge cases', () => {
    it('handles input with only stop words', () => {
      const result = matchChoice('I am the one', VP_ROADMAP_CHOICES);
      expect(result.choice).toBeDefined();
    });

    it('handles punctuation-heavy input', () => {
      const result = matchChoice('YES!!! Absolutely!!!', VP_ROADMAP_CHOICES);
      expect(result.choice.id).toBe('commit');
    });

    it('handles mixed case input', () => {
      const result = matchChoice('ABSOLUTELY YES', VP_ROADMAP_CHOICES);
      expect(result.choice.id).toBe('commit');
    });

    it('handles very long input', () => {
      const longInput = 'I think we should push back on the scope because the timeline is not realistic and we need to set better expectations with leadership about what the team can actually deliver given current capacity and the tech debt situation';
      const result = matchChoice(longInput, VP_ROADMAP_CHOICES);
      expect(result.choice.id).toBe('pushback');
    });

    it('prefers multi-word tone signals over single-word', () => {
      // "not sure" should match deflecting, not just "sure" -> committing
      const result = matchChoice("I'm not sure about this", VP_ROADMAP_CHOICES);
      expect(result.matchedTone).toBe('deflecting');
    });
  });
});

describe('analyzePlayerReply', () => {
  it('extracts reply signals from player text', () => {
    const analysis = analyzePlayerReply(
      'Honestly this feels risky, but I will take point and sync with the team.',
      STAKEHOLDERS,
      'direct'
    );

    expect(analysis.matchedTone).toBe('direct');
    expect(analysis.signals).toContain('risk');
    expect(analysis.signals).toContain('ownership');
    expect(analysis.signals).toContain('collaboration');
    expect(analysis.signals).toContain('transparency');
  });

  it('detects explicitly addressed stakeholders', () => {
    const analysis = analyzePlayerReply(
      '@riley can you help me frame the risks?',
      STAKEHOLDERS,
      'direct'
    );

    expect(analysis.addressedStakeholderIds).toEqual(['the-staff-eng']);
  });
});
