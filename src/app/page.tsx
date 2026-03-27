'use client';

import { useMemo, useState } from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { Q4_PLANNING_SCENARIO } from '@/content/scenarios/q4-planning';
import { AcceptOfferScreen } from '@/components/game/AcceptOfferScreen';
import { MorningBrief } from '@/components/game/MorningBrief';
import { Workspace } from '@/components/slack/Workspace';
import { ReviewScreen } from '@/components/review/ReviewScreen';
import type { DifficultyConfig, PendingDecision } from '@/engine/types';
import { buildPeerFeedback } from '@/review/buildPeerFeedback';

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
