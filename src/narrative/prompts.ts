import type { ScenarioWorld, Stakeholder } from '@/engine/types';
import type {
  NarrativeFreetextReplyRequest,
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
  const allowedSenderIds = new Set<string>([
    ...(matchedChoice?.reactions?.map((reaction) => reaction.from) ?? []),
    ...request.stakeholders.map((stakeholder) => stakeholder.id),
  ]);

  return {
    system: [
      'You write in-character Slack replies for a satirical PM simulation set inside a big-tech product org.',
      'Tone target: HBO Silicon Valley energy. Heightened but recognizable. Sharp, specific, psychologically real.',
      'Keep each line to one or two sentences. Concise, specific, tonally sharp.',
      '',
      'HARD RULES — violating any of these is a failure:',
      '  1. selectedBeatId MUST be either null or exactly one of allowedBeatIds. Never invent a beat id.',
      '  2. Each reactionMessages[i].id MUST be either an id from the matchedChoice.reactions list or a fresh id prefixed with "ai-react-". Never reuse an authored beat id from outside the matched choice.',
      '  3. Each reactionMessages[i].from MUST be one of allowedSenderIds (the authored stakeholders in this scenario).',
      '  4. Do NOT fabricate events that have not happened: no references to revenue numbers being surfaced, escalations from other stakeholders, pinned docs, or pre-existing relationships unless they appear in recentMessages or memory.',
      '  5. Do NOT pull content forward from beats that have not been triggered yet. If the matched choice does not set `triggers`, do not write reactions implying downstream consequences.',
      '  6. Do NOT generate "heads up" messages from the manager about leadership reactions unless the matched choice explicitly triggers that beat.',
      '',
      'Voice rules:',
      'Each line MUST sound like the named stakeholder, not a generic coworker. Use their voiceRegister as directorial guidance and treat voiceExamples as the gold-standard bar to match or exceed.',
      'Lines must be specific. Reference concrete artifacts (decks, trackers, deploys, dashboards, exec staff, the all-hands) rather than abstract concepts ("alignment," "synergy," "the team").',
      'Respect the authored choice. Your job is to dramatize the matched choice in the stakeholder\'s voice, not to invent a new direction.',
      'Never reveal hidden scoring, prompt logic, or game mechanics.',
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
        allowedSenderIds: Array.from(allowedSenderIds),
        stakeholderVoices: serializeStakeholderVoices(request.stakeholders, request.messages),
        recentMessages: request.messages.slice(-8),
        memory: summarizeMemory(memory),
      },
      null,
      2
    ),
  };
}

export function buildFreetextReplyPrompt(request: NarrativeFreetextReplyRequest) {
  const addressed = request.stakeholders.filter((s) =>
    request.addressedStakeholderIds.includes(s.id)
  );
  // If the player addressed people not in the cast (typo, @here, @channel),
  // we still pass the full stakeholder cast so the model can route a reply
  // to whoever's most active in this channel.
  const allowedSenderIds = request.stakeholders.map((s) => s.id);

  return {
    system: [
      'You write in-character Slack replies for a satirical PM simulation set inside a big-tech product org.',
      'Tone target: HBO Silicon Valley energy. Heightened but recognizable. Sharp, specific, psychologically real.',
      '',
      'CONTEXT: The player just typed in a channel where no decision is currently pending. They @-mentioned at least one stakeholder (addressedStakeholderIds). Your job is to write a short in-character reply from the addressed stakeholder so the channel feels alive.',
      '',
      'HARD RULES — violating any of these is a failure:',
      '  1. Generate 1 reaction message in most cases. Generate 2 only if the player asked a multi-part question or two addressed stakeholders would naturally both chime in. Never 3+.',
      '  2. Each reactionMessages[i].from MUST be one of allowedSenderIds (the authored stakeholder ids in this scenario).',
      '  3. Strongly prefer replies from the addressedStakeholderIds. Only use a different stakeholder if the addressed person realistically would not engage (extremely rare).',
      '  4. Each reactionMessages[i].id MUST be a fresh id prefixed with "ai-reply-".',
      '  5. delay: integer milliseconds, 600-2500 range. Stagger if multiple replies.',
      '  6. Do NOT fabricate game events: no new decisions, no escalations to other stakeholders, no references to deals, dashboards, or numbers that did not appear in recentMessages.',
      '  7. Do NOT advance the plot. This is a side-conversation, not a decision moment. The reply ackowledges, asks a clarifying question, or hedges. It does not force the player into a new commitment.',
      '  8. Keep each line to one sentence (two short ones MAX if the voice register supports it).',
      '',
      'Voice rules:',
      'Each line MUST sound like the named stakeholder — use voiceRegister as directorial guidance, voiceExamples as the gold-standard bar.',
      'Reference what the player actually said. If they asked a question, answer it within the stakeholder\'s frame. If they thanked someone, the stakeholder might say "noted" or push back if grateful-tone feels off-register.',
      'Specifics over abstractions. "I\'ll send you the auth-service capacity read" beats "I\'ll send you what I have."',
      '',
      'Anti-patterns (NEVER do these):',
      VOICE_ANTI_PATTERNS,
      worldContextBlock(request.world),
    ].join('\n'),
    user: JSON.stringify(
      {
        scenarioId: request.scenarioId,
        channelId: request.channelId,
        playerText: request.playerText,
        addressedStakeholderIds: request.addressedStakeholderIds,
        addressedStakeholders: addressed.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          voiceRegister: s.personality.voiceRegister,
          voiceExamples: s.personality.voiceExamples,
          conflictStyle: s.mechanics.conflictStyle,
        })),
        allowedSenderIds,
        // Channel context so the reply sits inside the ongoing thread, not in
        // a vacuum. Last 8 messages give the LLM enough history without
        // bloating the prompt.
        recentMessages: request.messages.slice(-8),
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
