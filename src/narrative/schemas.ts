import { z } from 'zod';

export const narrativeMemoryPatchSchema = z.object({
  stakeholderStates: z.record(
    z.string(),
    z.object({
      trust: z.number().min(0).max(100).optional(),
      tension: z.number().min(0).max(100).optional(),
      impatience: z.number().min(0).max(100).optional(),
      helpfulness: z.number().min(0).max(100).optional(),
      lastUpdatedAt: z.number().optional(),
    })
  ).optional(),
  openLoops: z.array(
    z.object({
      id: z.string(),
      stakeholderId: z.string().nullable(),
      summary: z.string(),
      sourceDecisionId: z.string().nullable(),
      status: z.enum(['open', 'resolved', 'stale']),
      createdAt: z.number(),
    })
  ).optional(),
  resolvedOpenLoopIds: z.array(z.string()).optional(),
  roomBeliefs: z.array(
    z.object({
      audience: z.string(),
      belief: z.string(),
      confidence: z.number(),
      updatedAt: z.number(),
    })
  ).optional(),
  decisionLedgerEntry: z.object({
    decisionId: z.string(),
    choiceId: z.string().nullable(),
    summary: z.string(),
    timestamp: z.number(),
    tags: z.array(z.string()),
  }).optional(),
  notableMoments: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['commitment', 'contradiction', 'escalation', 'ownership', 'ghosting']),
      summary: z.string(),
      stakeholderIds: z.array(z.string()),
      timestamp: z.number(),
    })
  ).optional(),
});

export const analyzeOutputSchema = z.object({
  matchedChoiceId: z.string(),
  confidence: z.number().min(0).max(1),
  tone: z.enum(['diplomatic', 'direct', 'deflecting', 'committing']).nullable(),
  signals: z.array(
    z.enum([
      'ownership',
      'collaboration',
      'risk',
      'deferral',
      'help_request',
      'boundary_setting',
      'transparency',
    ])
  ),
  addressedStakeholderIds: z.array(z.string()),
  memoryPatch: narrativeMemoryPatchSchema,
  contradictionFlags: z.array(z.string()),
  complexityScore: z.number().int().min(0).max(10),
});

export const realizeOutputSchema = z.object({
  selectedBeatId: z.string().nullable(),
  reactionMessages: z.array(
    z.object({
      id: z.string(),
      from: z.string(),
      content: z.string(),
      delay: z.number().min(0),
      mentionsPlayer: z.boolean().optional(),
      contextValue: z.enum(['noise', 'ambient', 'optional', 'trap']).optional(),
    })
  ),
  toneTags: z.array(z.string()),
});

export const guardrailOutputSchema = z.object({
  passes: z.boolean(),
  violations: z.array(z.string()),
});

export const reviewOutputSchema = z.object({
  managerReview: z.string(),
  peerFeedback: z.array(
    z.object({
      stakeholderId: z.string(),
      feedback: z.string(),
    })
  ),
  calibrationOutcome: z.string().optional(),
});
