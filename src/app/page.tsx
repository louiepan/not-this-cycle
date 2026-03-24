'use client';

import { useMemo, useState } from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { Q4_PLANNING_SCENARIO, PEER_FEEDBACK_TEMPLATES } from '@/content/scenarios/q4-planning';
import { AcceptOfferScreen } from '@/components/game/AcceptOfferScreen';
import { MorningBrief } from '@/components/game/MorningBrief';
import { Workspace } from '@/components/slack/Workspace';
import { ReviewScreen } from '@/components/review/ReviewScreen';
import type { DifficultyConfig, PendingDecision, RatingResult, VariableName } from '@/engine/types';

function buildPeerFeedback(
  result: RatingResult,
): RatingResult {
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

export default function Home() {
  const session = useGameSession(Q4_PLANNING_SCENARIO);
  const [playerName, setPlayerName] = useState('You');
  const [pendingBrief, setPendingBrief] = useState<DifficultyConfig | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const resolvedResult = useMemo(() => {
    if (!session.ratingResult) return null;
    return buildPeerFeedback(session.ratingResult);
  }, [session.ratingResult]);

  if (session.phase === 'menu') {
    if (pendingBrief) {
      return (
        <MorningBrief
          difficulty={pendingBrief}
          playerName={playerName}
          onBack={() => setPendingBrief(null)}
          onContinue={() => {
            session.startGame(pendingBrief);
            setPendingBrief(null);
          }}
        />
      );
    }

    return (
      <AcceptOfferScreen
        initialPlayerName={playerName === 'You' ? '' : playerName}
        onAccept={(diff: DifficultyConfig, submittedName: string) => {
          setPlayerName(submittedName);
          if (diff.id === 'junior') {
            setPendingBrief(diff);
            return;
          }
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
        onPlayAgain={() => {
          setSelectedProfileId(null);
          setPendingBrief(null);
          session.resetGame();
        }}
      />
    );
  }

  if (!session.gameState) return null;

  const activeChannel = session.gameState.activeChannel;
  const pendingDecisionCounts = session.gameState.pendingDecisions.reduce<Record<string, number>>(
    (counts, decision) => {
      counts[decision.channel] = (counts[decision.channel] || 0) + 1;
      return counts;
    },
    {}
  );
  const activePendingDecision: PendingDecision | null =
    session.gameState.pendingDecisions.find((decision) => decision.channel === activeChannel) ?? null;
  const hasDecision = session.gameState.pendingDecisions.some(
    (d) => d.channel === activeChannel
  );

  return (
    <Workspace
      channels={session.channels}
      activeChannelId={activeChannel}
      messages={session.gameState.messages}
      stakeholders={session.stakeholders}
      stakeholderNames={session.stakeholderNames}
      playerName={playerName}
      unreadCounts={session.gameState.unreadCounts}
      mentionCounts={session.gameState.mentionCounts}
      pendingDecisionCounts={pendingDecisionCounts}
      activePendingDecision={activePendingDecision}
      hasDecision={hasDecision}
      nudge={session.nudgeMessage}
      typingNames={session.typingNames}
      gameClock={session.formatClockDisplay()}
      selectedProfileId={selectedProfileId}
      onChannelSelect={(id: string) => session.switchChannel(id)}
      onMessageSubmit={(text: string) => session.submitText(activeChannel, text)}
      onProfileOpen={(id: string) => setSelectedProfileId(id)}
      onProfileClose={() => setSelectedProfileId(null)}
      formatTime={session.formatGameTime}
    />
  );
}
