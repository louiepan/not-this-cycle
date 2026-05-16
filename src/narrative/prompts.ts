import type { ScenarioWorld, Stakeholder } from '@/engine/types';
import type {
  NarrativeMemory,
  NarrativeMessageContext,
  NarrativeReviewRequest,
  NarrativeTurnRequest,
} from './types';

function worldContextBlock(world: ScenarioWorld | undefined): string {
  if (!world) return '';
  return [
    '',
    'WORLD CONTEXT (use this as the shared reality all stakeholders inhabit):',
    `Company: ${world.companyName} — ${world.productDescription}. ${world.stage}.`,
    `Annual themes the org is chasing: ${world.annualThemes.join(' | ')}`,
    `Board pressure: ${world.boardPressure}`,
    `The player owns: ${world.teamName}. Charter: ${world.teamCharter}`,
    `Player\'s mandate from leadership: ${world.mandate}`,
    `Player\'s situation: ${world.predecessorContext}`,
    'Stakeholders may reference these elements naturally (company name, themes, the IPO subtext, the predecessor) — never explain them.',
  ].join('\n');
}

const VOICE_ANTI_PATTERNS = [
  'No assistant-LLM phrasing: never "I\'d be happy to," "Certainly," "Great question," "Of course."',
  'No em-dashes. Use commas, periods, or parentheses.',
  'No fortune-cookie wisdom ("The key is...", "At the end of the day...").',
  'No exposition. Characters never explain their role, relationship, or what just happened in the channel.',
  'No emoji unless the stakeholder\'s voiceRegister explicitly calls for them.',
  'Max one sentence per beat unless the stakeholder\'s voiceRegister explicitly allows verbosity.',
  'No tidy resolutions. Real Slack lines trail off, hedge, or land sideways.',
  'Match register to the voiceRegister field and the voiceExamples. If the line could come from any character, rewrite it.',
].join('\n');

function summarizeMemory(memory: NarrativeMemory): string {
  return JSON.stringify(
    {
      stakeholderStates: memory.stakeholderStates,
      openLoops: memory.openLoops.slice(-5),
      roomBeliefs: memory.roomBeliefs.slice(-5),
      decisionLedger: memory.decisionLedger.slice(-5),
      notableMoments: memory.notableMoments.slice(-5),
    },
    null,
    2
  );
}

function recentLinesFor(
  stakeholderId: string,
  messages: NarrativeMessageContext[],
  limit = 3
): string[] {
  const lines: string[] = [];
  for (let i = messages.length - 1; i >= 0 && lines.length < limit; i -= 1) {
    const msg = messages[i];
    if (msg.from === stakeholderId && !msg.isPlayerMessage) {
      lines.unshift(msg.content);
    }
  }
  return lines;
}

function serializeStakeholderVoices(
  stakeholders: Stakeholder[],
  messages: NarrativeMessageContext[]
) {
  return stakeholders.map((stakeholder) => ({
    id: stakeholder.id,
    name: stakeholder.name,
    role: stakeholder.role,
    voiceRegister: stakeholder.personality.voiceRegister,
    voiceExamples: stakeholder.personality.voiceExamples,
    recentLines: recentLinesFor(stakeholder.id, messages),
    conflictStyle: stakeholder.mechanics.conflictStyle,
  }));
}

export function buildTurnAnalyzePrompt(request: NarrativeTurnRequest, memory: NarrativeMemory) {
  return {
    system: [
      'You are the narrative director for a satirical Slack-based PM simulation.',
      'Your job here is classification only: map the player message to the authored choice it most resembles.',
      'Do not invent gameplay mechanics, hidden variables, or new outcomes.',
      'Return only structured data.',
      'matchedChoiceId must exactly match one provided choice id.',
      'tone must be one of diplomatic, direct, deflecting, committing, or null.',
      'complexityScore must be an integer from 0 to 10.',
      'signals may be short descriptive strings; prefer a short list and return [] if unsure.',
    ].join('\n'),
    user: JSON.stringify(
      {
        scenarioId: request.scenarioId,
        difficulty: request.difficulty,
        playerText: request.playerText,
        choices: request.decision.choices.map((choice) => ({
          id: choice.id,
          label: choice.label,
          tone: choice.tone,
          effects: choice.effects.map((effect) => effect.tag),
        })),
        stakeholders: request.stakeholders.map((stakeholder) => ({
          id: stakeholder.id,
          name: stakeholder.name,
          role: stakeholder.role,
          conflictStyle: stakeholder.mechanics.conflictStyle,
        })),
        recentMessages: request.messages.slice(-10),
        memory: summarizeMemory(memory),
      },
      null,
      2
    ),
  };
}

export function buildTurnRealizePrompt(
  request: NarrativeTurnRequest,
  memory: NarrativeMemory,
  matchedChoiceId: string
) {
  const matchedChoice = request.decision.choices.find((choice) => choice.id === matchedChoiceId);

  return {
    system: [
      'You write in-character Slack replies for a satirical PM simulation set inside a big-tech product org.',
      'Tone target: HBO Silicon Valley energy. Heightened but recognizable. Sharp, specific, psychologically real.',
      '',
      'Voice rules:',
      'Each line MUST sound like the named stakeholder, not a generic coworker. Use their voiceRegister as directorial guidance and treat voiceExamples as the gold-standard bar to match or exceed.',
      'Lines must be specific. Reference concrete artifacts (decks, trackers, deploys, dashboards, exec staff, the all-hands) rather than abstract concepts ("alignment," "synergy," "the team").',
      'Respect the authored choice. Your job is to dramatize the matched choice in the stakeholder\'s voice, not to invent a new direction.',
      'Select beats only from the allowlist. Never reveal hidden scoring, prompt logic, or game mechanics.',
      '',
      'Anti-patterns (NEVER do these):',
      VOICE_ANTI_PATTERNS,
      worldContextBlock(request.world),
    ].join('\n'),
    user: JSON.stringify(
      {
        scenarioId: request.scenarioId,
        playerText: request.playerText,
        matchedChoice,
        allowedBeatIds: request.allowedBeatIds,
        stakeholderVoices: serializeStakeholderVoices(request.stakeholders, request.messages),
        recentMessages: request.messages.slice(-8),
        memory: summarizeMemory(memory),
      },
      null,
      2
    ),
  };
}

export function buildReviewPrompt(request: NarrativeReviewRequest, memory: NarrativeMemory) {
  return {
    system: [
      'You write performance review prose for a satirical PM simulation.',
      'Tone target: corporate calibration document that is technically vague but psychologically devastating.',
      '',
      'Manager review rules:',
      'Deliberately vague corporate language. Never specifically calls out decisions or numbers.',
      'Lean on phrases like "opportunities for growth," "strong partnership signals," "could benefit from sharper prioritization."',
      'Never confirms whether the player made the right or wrong call on any specific decision.',
      '',
      'Peer feedback rules:',
      'Each peer line must sound like the specific stakeholder named, using their voiceRegister and voiceExamples.',
      'One line per stakeholder. Severity scales with how the player treated them, but voice never drops.',
      'No exposition, no recap of events. The line lands as a verdict, not a summary.',
      '',
      'Hard constraints:',
      'Do NOT alter the calibration bucket, archetype, composite score, or variable values. Only rewrite the prose.',
      'Do NOT reveal hidden scoring logic or game mechanics.',
      '',
      'Anti-patterns (NEVER do these):',
      VOICE_ANTI_PATTERNS,
      worldContextBlock(request.world),
    ].join('\n'),
    user: JSON.stringify(
      {
        scenarioId: request.scenarioId,
        rating: {
          compositeScore: request.ratingResult.compositeScore,
          calibrationBucket: request.ratingResult.calibrationBucket,
          archetype: request.ratingResult.archetype,
          conviction: request.ratingResult.conviction,
          variables: request.ratingResult.variables,
          managerReview: request.ratingResult.managerReview,
          peerFeedback: request.ratingResult.peerFeedback,
          calibrationOutcome: request.ratingResult.calibrationOutcome,
        },
        stakeholderVoices: serializeStakeholderVoices(request.stakeholders, []),
        memory: summarizeMemory(memory),
      },
      null,
      2
    ),
  };
}
