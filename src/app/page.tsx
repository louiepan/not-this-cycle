'use client';

import { useMemo } from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { Q4_PLANNING_SCENARIO, PEER_FEEDBACK_TEMPLATES } from '@/content/scenarios/q4-planning';
import { AcceptOfferScreen } from '@/components/game/AcceptOfferScreen';
import { Workspace } from '@/components/slack/Workspace';
import { ReviewScreen } from '@/components/review/ReviewScreen';
import type { Choice, DifficultyConfig, RatingResult, VariableName } from '@/engine/types';

function buildPeerFeedback(
  result: RatingResult,
  stakeholderNames: Record<string, string>
): RatingResult {
  const feedback: { stakeholderId: string; feedback: string }[] = [];

  for (const [stakeholderId, template] of Object.entries(PEER_FEEDBACK_TEMPLATES)) {
    const variable = template.variable as VariableName;
    const value = result.variables[variable];

    let tier: 'polite' | 'pointed' | 'maskOff';
    if (variable === 'techDebt' || variable === 'responsivenessDebt') {
      tier = value <= 30 ? 'polite' : value <= 60 ? 'pointed' : 'maskOff';
    } else {
      tier = value >= 60 ? 'polite' : value >= 40 ? 'pointed' : 'maskOff';
    }

    feedback.push({
      stakeholderId,
      feedback: template[tier],
    });
  }

  return { ...result, peerFeedback: feedback };
}

export default function Home() {
  const session = useGameSession(Q4_PLANNING_SCENARIO);

  const resolvedResult = useMemo(() => {
    if (!session.ratingResult) return null;
    return buildPeerFeedback(session.ratingResult, session.stakeholderNames);
  }, [session.ratingResult, session.stakeholderNames]);

  if (session.phase === 'menu') {
    return (
      <AcceptOfferScreen
        onAccept={(diff: DifficultyConfig) => session.startGame(diff)}
      />
    );
  }

  if (session.phase === 'review' && resolvedResult) {
    return (
      <ReviewScreen
        result={resolvedResult}
        stakeholders={session.stakeholders}
        onPlayAgain={() => window.location.reload()}
      />
    );
  }

  if (!session.gameState) return null;

  const activeChannel = session.gameState.activeChannel;
  const channelChoices = session.getChoicesForChannel(activeChannel);

  return (
    <Workspace
      channels={session.channels}
      activeChannelId={activeChannel}
      messages={session.gameState.messages}
      stakeholderNames={session.stakeholderNames}
      playerName="You"
      unreadCounts={session.gameState.unreadCounts}
      mentionCounts={session.gameState.mentionCounts}
      choices={channelChoices}
      typingNames={session.typingNames}
      gameClock={session.formatClockDisplay()}
      onChannelSelect={(id: string) => session.switchChannel(id)}
      onChoiceSelect={(choice: Choice) => {
        const pending = session.gameState?.pendingDecisions.find(
          (d) => d.channel === activeChannel
        );
        if (pending) {
          session.resolveDecision(pending.decisionId, choice);
        }
      }}
      formatTime={session.formatGameTime}
    />
  );
}
