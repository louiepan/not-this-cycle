import type { Choice, Stakeholder } from '@/engine/types';
import type { NarrativeReactionMessage, NarrativeRealizeOutput } from './types';

export interface RealizeGuardrailContext {
  matchedChoice: Choice;
  stakeholders: Stakeholder[];
  allowedBeatIds: string[];
}

export interface RealizeGuardrailResult {
  output: NarrativeRealizeOutput;
  violations: string[];
}

const AI_GENERATED_ID_PREFIX = 'ai-react-';
const MAX_REACTION_CHARS = 320;

export function sanitizeRealizeOutput(
  raw: NarrativeRealizeOutput,
  context: RealizeGuardrailContext
): RealizeGuardrailResult {
  const violations: string[] = [];

  const allowedSenderIds = new Set<string>([
    ...context.stakeholders.map((stakeholder) => stakeholder.id),
    ...(context.matchedChoice.reactions?.map((reaction) => reaction.from) ?? []),
  ]);
  const authoredReactionIds = new Set<string>(
    context.matchedChoice.reactions?.map((reaction) => reaction.id) ?? []
  );
  const allowedBeatIdSet = new Set<string>(context.allowedBeatIds);

  let selectedBeatId = raw.selectedBeatId;
  if (selectedBeatId !== null && !allowedBeatIdSet.has(selectedBeatId)) {
    violations.push(`selectedBeatId "${selectedBeatId}" not in allowedBeatIds`);
    selectedBeatId = null;
  }

  const reactionMessages: NarrativeReactionMessage[] = [];
  for (const reaction of raw.reactionMessages) {
    if (!allowedSenderIds.has(reaction.from)) {
      violations.push(`reaction from "${reaction.from}" is not a known stakeholder`);
      continue;
    }
    const isAuthoredId = authoredReactionIds.has(reaction.id);
    const isAiPrefixed = reaction.id.startsWith(AI_GENERATED_ID_PREFIX);
    if (!isAuthoredId && !isAiPrefixed) {
      violations.push(
        `reaction id "${reaction.id}" must come from matchedChoice.reactions or use the "${AI_GENERATED_ID_PREFIX}" prefix`
      );
      continue;
    }
    if (reaction.content.length > MAX_REACTION_CHARS) {
      violations.push(`reaction "${reaction.id}" exceeds ${MAX_REACTION_CHARS} chars`);
      continue;
    }
    reactionMessages.push(reaction);
  }

  return {
    output: {
      selectedBeatId,
      reactionMessages,
      toneTags: raw.toneTags,
    },
    violations,
  };
}
