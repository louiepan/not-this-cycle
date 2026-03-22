'use client';

import { useMemo, useState } from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { Q4_PLANNING_SCENARIO, PEER_FEEDBACK_TEMPLATES } from '@/content/scenarios/q4-planning';
import { AcceptOfferScreen } from '@/components/game/AcceptOfferScreen';
import { Workspace } from '@/components/slack/Workspace';
import { ReviewScreen } from '@/components/review/ReviewScreen';
import type { DifficultyConfig, RatingResult, VariableName } from '@/engine/types';

function buildPeerFeedback(
  result: RatingResult,
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
  const [playerName, setPlayerName] = useState('You');

  const resolvedResult = useMemo(() => {
    if (!session.ratingResult) return null;
    return buildPeerFeedback(session.ratingResult);
  }, [session.ratingResult]);

  if (session.phase === 'menu') {
    return (
      <AcceptOfferScreen
        initialPlayerName={playerName === 'You' ? '' : playerName}
        onAccept={(diff: DifficultyConfig, submittedName: string) => {
          setPlayerName(submittedName);
          session.startGame(diff);
        }}
      />
    );
  }

  if (session.phase === 'review' && resolvedResult) {
    return (
      <ReviewScreen
        result={resolvedResult}
        stakeholders={session.stakeholders}
        playerName={playerName}
        onPlayAgain={() => session.resetGame()}
      />
    );
  }

  if (!session.gameState) return null;

  const activeChannel = session.gameState.activeChannel;
  const hasDecision = session.gameState.pendingDecisions.some(
    (d) => d.channel === activeChannel
  );

  return (
    <Workspace
      channels={session.channels}
      activeChannelId={activeChannel}
      messages={session.gameState.messages}
      stakeholderNames={session.stakeholderNames}
      playerName={playerName}
      unreadCounts={session.gameState.unreadCounts}
      mentionCounts={session.gameState.mentionCounts}
      hasDecision={hasDecision}
      nudge={session.nudgeMessage}
      typingNames={session.typingNames}
      gameClock={session.formatClockDisplay()}
      onChannelSelect={(id: string) => session.switchChannel(id)}
      onMessageSubmit={(text: string) => session.submitText(activeChannel, text)}
      formatTime={session.formatGameTime}
    />
  );
}
