import type { RatingResult, VariableName } from '@/engine/types';
import { PEER_FEEDBACK_TEMPLATES } from '@/content/scenarios/q4-planning';

export function buildPeerFeedback(result: RatingResult): RatingResult {
  if (result.peerFeedback.length > 0) {
    return result;
  }

  const feedback: { stakeholderId: string; feedback: string; severity: number }[] = [];

  for (const [stakeholderId, template] of Object.entries(PEER_FEEDBACK_TEMPLATES)) {
    const variable = template.variable as VariableName;
    const value = result.variables[variable];

    let tier: 'polite' | 'pointed' | 'maskOff';
    let severity: number;
    if (variable === 'techDebt' || variable === 'responsivenessDebt') {
      tier = value <= 30 ? 'polite' : value <= 60 ? 'pointed' : 'maskOff';
      severity = value;
    } else {
      tier = value >= 60 ? 'polite' : value >= 40 ? 'pointed' : 'maskOff';
      severity = 100 - value;
    }

    feedback.push({
      stakeholderId,
      feedback: template[tier],
      severity,
    });
  }

  feedback.sort((a, b) => b.severity - a.severity);

  return {
    ...result,
    peerFeedback: feedback.map(({ stakeholderId, feedback: copy }) => ({
      stakeholderId,
      feedback: copy,
    })),
  };
}
