'use client';

import { useMemo, useState } from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { Q4_PLANNING_SCENARIO } from '@/content/scenarios/q4-planning';
import { AcceptOfferScreen } from '@/components/game/AcceptOfferScreen';
import { IntroScreen, type IntroSubmission } from '@/components/game/IntroScreen';
import { MorningBrief } from '@/components/game/MorningBrief';
import { Workspace } from '@/components/slack/Workspace';
import { ReviewScreen } from '@/components/review/ReviewScreen';
import { Window } from '@/components/layout/Window';
import type { DifficultyConfig, PendingDecision } from '@/engine/types';
import { buildPeerFeedback } from '@/review/buildPeerFeedback';

export default function Home() {
  const session = useGameSession(Q4_PLANNING_SCENARIO);
  const [playerName, setPlayerName] = useState('You');
  // playerEmail stays in component state only; not persisted across refreshes.
  // Marketing-platform sync will dedupe by email when wired up (BACKLOG).
  const [playerEmail, setPlayerEmail] = useState('');
  const [introCompleted, setIntroCompleted] = useState(false);
  const [pendingBrief, setPendingBrief] = useState<DifficultyConfig | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const handleIntroSubmit = (data: IntroSubmission) => {
    setPlayerName(data.fullName);
    setPlayerEmail(data.email);
    setIntroCompleted(true);
    // TODO: forward to marketing platform per BACKLOG (email sync + consent gating).
  };

  const resolvedResult = useMemo(() => {
    if (!session.ratingResult) return null;
    return buildPeerFeedback(session.ratingResult);
  }, [session.ratingResult]);

  if (!introCompleted) {
    return (
      <Window theme="light">
        <IntroScreen
          initialData={{
            fullName: playerName === 'You' ? '' : playerName,
            email: playerEmail,
          }}
          onSubmit={handleIntroSubmit}
        />
      </Window>
    );
  }

  if (session.phase === 'menu') {
    if (pendingBrief) {
      return (
        <Window theme="dark">
          <MorningBrief
            difficulty={pendingBrief}
            playerName={playerName}
            world={session.world}
            onBack={() => setPendingBrief(null)}
            onContinue={() => {
              session.startGame(pendingBrief, playerName);
              setPendingBrief(null);
            }}
          />
        </Window>
      );
    }

    return (
      <Window theme="light">
        <AcceptOfferScreen
          initialPlayerName={playerName === 'You' ? '' : playerName}
          world={session.world}
          offerContext={session.offerContext}
          onAccept={(diff: DifficultyConfig, submittedName: string) => {
            setPlayerName(submittedName);
            if (diff.id === 'junior') {
              setPendingBrief(diff);
              return;
            }
            session.startGame(diff, submittedName);
          }}
        />
      </Window>
    );
  }

  if (session.phase === 'review' && resolvedResult) {
    return (
      <Window theme="light">
        <ReviewScreen
          result={resolvedResult}
          stakeholders={session.stakeholders}
          playerName={playerName}
          world={session.world}
          sessionId={session.sessionId}
          onPlayAgain={() => {
            setSelectedProfileId(null);
            setPendingBrief(null);
            session.resetGame();
          }}
        />
      </Window>
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
    <Window theme="dark">
      <Workspace
        channels={session.channels}
        activeChannelId={activeChannel}
        messages={session.gameState.messages}
        stakeholders={session.stakeholders}
        stakeholderNames={session.stakeholderNames}
        playerName={playerName}
        world={session.world}
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
    </Window>
  );
}
