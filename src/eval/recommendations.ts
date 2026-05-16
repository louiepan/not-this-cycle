import type { Finding, Recommendation, Transcript } from './types';

let recCounter = 0;
function nextRecId(): string {
  recCounter += 1;
  return `rec-${Date.now().toString(36)}-${recCounter}`;
}

// Each finding gets turned into one recommendation. The suggested change is
// templated by category — concrete enough to act on, vague enough to allow
// human judgment about the specific wording.
function recommendationFor(finding: Finding, transcript: Transcript): Recommendation {
  const stakeholder = finding.evidence.stakeholderId
    ? transcript.stakeholders.find((s) => s.id === finding.evidence.stakeholderId)
    : null;

  let suggestedChange = '';
  let rationale = '';
  let confidence = 0.5;

  switch (finding.category) {
    case 'voice': {
      if (finding.title.startsWith('Banned phrase')) {
        suggestedChange = `Rewrite the line to use ${stakeholder?.name ?? 'the stakeholder'}'s voiceRegister. Reference voiceExamples in src/content/scenarios/q4-planning.ts for the right tone. Either tighten the AI prompt's anti-pattern reminder for this stakeholder, or add a guardrail-lint pass that rejects responses containing banned phrases.`;
        rationale = `Banned phrases survived the prompt guard. Either the prompt isn't enforcing strictly, the model ignored the rule, or fallback dialogue contains the phrase. Worth tracing which path generated this line.`;
        confidence = 0.9;
      } else if (finding.title.includes('Em-dash')) {
        suggestedChange = 'Add a post-generation lint that strips em-dashes from AI output, or tighten the system prompt with an explicit example of bad em-dash usage and its replacement.';
        rationale = 'Em-dashes are anti-pattern but the model leaks them frequently. Cheap to fix at lint level.';
        confidence = 0.85;
      } else if (finding.title.includes('word reply')) {
        suggestedChange = `Add a max-token guardrail in the AI generation request for ${stakeholder?.name ?? 'this stakeholder'}, or strengthen the prompt note: "${stakeholder?.personality.voiceRegister ?? '(voice register)'}". Consider adding a "voiceMaxWords" hint to StakeholderPersonality the generator respects.`;
        rationale = `Stakeholder's voiceExamples imply terseness; the model went verbose. Length is a measurable proxy for voice drift.`;
        confidence = 0.75;
      }
      break;
    }
    case 'engagement': {
      if (finding.title.includes('auto-resolved')) {
        suggestedChange = 'Either increase the decision timeout (DifficultyConfig.escalationTimeoutScale) for the affected difficulty, or audit which decisions timed out and review their phrasing/clarity. If the same decisions keep timing out across sessions, the decision text is probably the problem.';
        rationale = 'High timeout rate kills agency. The player either felt overwhelmed or didn\'t know to act.';
        confidence = 0.7;
      } else if (finding.title.includes('push-backs')) {
        suggestedChange = 'Review the decisions that triggered push-backs and consider expanding their authored choices, or rewriting the asking stakeholder\'s decision message to more clearly invite a specific kind of response. If push-backs concentrate on one stakeholder, their decision phrasing may be too oblique.';
        rationale = 'Push-backs are useful escalation but heavy use suggests the player didn\'t know what was being asked.';
        confidence = 0.6;
      } else if (finding.title.includes('averaged')) {
        suggestedChange = 'Consider lowering CONFIDENCE_THRESHOLD or adding more keyword aliases for common short responses ("yes," "ok," "sure") so brief replies still match a choice. Alternatively the decisions may need to invite longer replies more explicitly.';
        rationale = 'Short replies mean the player engaged but didn\'t feel they needed words.';
        confidence = 0.55;
      } else if (finding.title.includes('defer')) {
        suggestedChange = 'Defer/hedge is part of the satire (real PMs hedge). Low confidence — track defer rate across sessions before changing anything. If consistently >40% across players, consider adding stronger "commit or lose" pressure on some decisions.';
        rationale = 'May be intended behavior. Watch the trend before action.';
        confidence = 0.4;
      }
      break;
    }
    case 'pacing': {
      if (finding.title.includes('quiet stretch early')) {
        suggestedChange = 'Add 1-2 ambient noise messages in this time window. Pull from the ambient pool or author new low-stakes pings in noise channels. Goal: early game should feel like Slack is actively hammering.';
        rationale = 'Early-game dead air breaks the satirical "PM is drowning in Slack" tone.';
        confidence = 0.7;
      } else if (finding.title.includes('No breathing room')) {
        suggestedChange = 'Reduce ambientNoiseLevel for this difficulty, or stagger event triggerAt values so multiple messages don\'t land in the same 100ms tick.';
        rationale = 'No quiet moments means the player can\'t orient. Players need 3-5s gaps to read context.';
        confidence = 0.6;
      }
      break;
    }
    case 'coverage': {
      if (finding.title.includes('Only')) {
        suggestedChange = 'Audit scenario events — are too many gated behind player actions that the player never took? Either lower the trigger thresholds or add more time-triggered (vs. condition-triggered) events.';
        rationale = 'Game ended without exposing core scenario beats.';
        confidence = 0.7;
      } else if (finding.title.includes('Player visited')) {
        suggestedChange = 'Probably fine — noise channels should remain mostly unvisited. Only investigate if a specific signal channel was missed.';
        rationale = 'Noise channels being unvisited is by design.';
        confidence = 0.3;
      }
      break;
    }
    case 'matching': {
      suggestedChange = 'Review the matched-choice quality. Consider adjusting ChoiceMatcher keyword aliases or adding more authored choices to cover natural player phrasing.';
      rationale = 'Choice matching may be missing common phrasings.';
      confidence = 0.5;
      break;
    }
  }

  return {
    id: nextRecId(),
    findingId: finding.id,
    category: finding.category,
    severity: finding.severity,
    suggestedChange,
    rationale,
    confidence,
    status: 'pending_review',
  };
}

export function generateRecommendations(
  findings: Finding[],
  transcript: Transcript
): Recommendation[] {
  recCounter = 0;
  return findings.map((finding) => recommendationFor(finding, transcript));
}
