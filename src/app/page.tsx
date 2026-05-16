'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { Q4_PLANNING_SCENARIO } from '@/content/scenarios/q4-planning';
import { AcceptOfferScreen } from '@/components/game/AcceptOfferScreen';
import { MorningBrief } from '@/components/game/MorningBrief';
import { Workspace } from '@/components/slack/Workspace';
import { ReviewScreen } from '@/components/review/ReviewScreen';
import type { DifficultyConfig, PendingDecision } from '@/engine/types';
import { buildPeerFeedback } from '@/review/buildPeerFeedback';
import {
  loadProfile,
  appendRun,
  updateIdentity,
  clearProfile,
  recentRuns,
  type PlayerProfile,
} from '@/lib/playerProfile';
import { selectContinuityLines } from '@/content/continuityLines';

const EMPTY_PROFILE: PlayerProfile = {
  schemaVersion: 1,
  playerName: '',
  lastDifficulty: null,
  runHistory: [],
};

export default function Home() {
  const session = useGameSession(Q4_PLANNING_SCENARIO);
  const [profile, setProfile] = useState<PlayerProfile>(EMPTY_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [playerName, setPlayerName] = useState('You');
  const [pendingBrief, setPendingBrief] = useState<DifficultyConfig | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Hydrate profile from localStorage on mount (client-only).
  // We can't read localStorage during the server render, so the canonical
  // pattern is a one-shot effect that pulls it in after mount.
  useEffect(() => {
    const loaded = loadProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from external storage post-mount
    setProfile(loaded);
    if (loaded.playerName) {
      setPlayerName(loaded.playerName);
    }
    setProfileLoaded(true);
  }, []);

  const resolvedResult = useMemo(() => {
    if (!session.ratingResult) return null;
    return buildPeerFeedback(session.ratingResult);
  }, [session.ratingResult]);

  // Freeze continuity lines for the current review session so the panel
  // doesn't shift on re-render once the run has been appended.
  const [continuityLines, setContinuityLines] = useState<string[]>([]);
  const hasRecordedCurrentReviewRef = useRef(false);

  // Append the run to history exactly once when entering the review phase.
  useEffect(() => {
    if (!profileLoaded) return;

    if (session.phase !== 'review' || !resolvedResult) {
      // Reset guard so the next review session will record.
      hasRecordedCurrentReviewRef.current = false;
      return;
    }
    if (hasRecordedCurrentReviewRef.current) return;

    const currentDifficulty = session.difficulty.id;
    const previousHistory = profile.runHistory;

    // Synchronizing with the external game-engine phase transition into
    // 'review'. We need the *previous* history snapshot for continuity-line
    // generation, then we persist the current run to localStorage. Both
    // setStates are legitimate "external system → React" sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing engine phase to derived UI state
    setContinuityLines(
      selectContinuityLines({
        history: previousHistory,
        current: {
          archetype: resolvedResult.archetype,
          calibrationBucket: resolvedResult.calibrationBucket,
          difficulty: currentDifficulty,
        },
        playerName,
      })
    );

    const updated = appendRun({
      difficulty: currentDifficulty,
      archetype: resolvedResult.archetype,
      calibrationBucket: resolvedResult.calibrationBucket,
      scenarioId: Q4_PLANNING_SCENARIO.id,
    });
    setProfile(updated);
    hasRecordedCurrentReviewRef.current = true;
  }, [session.phase, session.difficulty, resolvedResult, profileLoaded, profile.runHistory, playerName]);

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
        initialPlayerName={profile.playerName || (playerName === 'You' ? '' : playerName)}
        pastRuns={recentRuns(profile, 50)}
        onResetProfile={() => {
          clearProfile();
          setProfile(EMPTY_PROFILE);
          setPlayerName('You');
        }}
        onAccept={(diff: DifficultyConfig, submittedName: string) => {
          setPlayerName(submittedName);
          const updated = updateIdentity(submittedName, diff.id);
          setProfile(updated);
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
        continuityLines={continuityLines}
        onPlayAgain={() => {
          setSelectedProfileId(null);
          setPendingBrief(null);
          setContinuityLines([]);
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
