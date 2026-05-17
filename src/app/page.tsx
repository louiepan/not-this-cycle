'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { appendRun, loadProfile } from '@/lib/playerProfile';
import { selectContinuityLines } from '@/content/continuityLines';

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

  // Continuity: append each completed run to localStorage (`ntc:player:v1`)
  // and surface satirical lines on the review screen that reference prior
  // cycles. Ref-guarded so the append fires exactly once per review session
  // even if re-renders happen.
  const [continuityLines, setContinuityLines] = useState<string[]>([]);
  const hasRecordedCurrentReviewRef = useRef(false);

  useEffect(() => {
    if (session.phase !== 'review' || !resolvedResult) {
      hasRecordedCurrentReviewRef.current = false;
      return;
    }
    if (hasRecordedCurrentReviewRef.current) return;

    // Snapshot the history that existed *before* this run so the current
    // review is not counted in its own "Nth review" math.
    const profileBeforeThisRun = loadProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing engine phase transition into derived UI state
    setContinuityLines(
      selectContinuityLines({
        history: profileBeforeThisRun.runHistory,
        current: {
          archetype: resolvedResult.archetype,
          calibrationBucket: resolvedResult.calibrationBucket,
          difficulty: session.difficulty.id,
        },
        playerName,
        companyName: session.world.companyName,
      })
    );

    appendRun({
      difficulty: session.difficulty.id,
      archetype: resolvedResult.archetype,
      calibrationBucket: resolvedResult.calibrationBucket,
      scenarioId: Q4_PLANNING_SCENARIO.id,
    });

    hasRecordedCurrentReviewRef.current = true;
  }, [
    session.phase,
    session.difficulty,
    session.world.companyName,
    resolvedResult,
    playerName,
  ]);

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
            stakeholders={session.previewStakeholders}
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
            // Day 1 briefing runs for every difficulty. The 3-minute session
            // can't afford to spend its opening seconds on "wait, who are
            // these people and why am I here." Manager DM still does
            // in-world re-grounding once the game starts.
            setPendingBrief(diff);
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
          continuityLines={continuityLines}
          onPlayAgain={() => {
            setSelectedProfileId(null);
            setPendingBrief(null);
            setContinuityLines([]);
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
