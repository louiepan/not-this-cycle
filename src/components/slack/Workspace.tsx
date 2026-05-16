'use client';

import type { ChannelDef, DeliveredMessage, PendingDecision, ScenarioWorld, Stakeholder } from '@/engine/types';
import { Sidebar } from './Sidebar';
import { ChannelView } from './ChannelView';
import { ProfilePanel } from './ProfilePanel';

interface WorkspaceProps {
  channels: ChannelDef[];
  activeChannelId: string;
  messages: DeliveredMessage[];
  stakeholders: Stakeholder[];
  stakeholderNames: Record<string, string>;
  playerName: string;
  world: ScenarioWorld;
  unreadCounts: Record<string, number>;
  mentionCounts: Record<string, number>;
  pendingDecisionCounts: Record<string, number>;
  activePendingDecision: PendingDecision | null;
  hasDecision: boolean;
  nudge: string | null;
  typingNames: string[];
  gameClock: string;
  selectedProfileId: string | null;
  onChannelSelect: (channelId: string) => void;
  onMessageSubmit: (text: string) => void;
  onProfileOpen: (stakeholderId: string) => void;
  onProfileClose: () => void;
  formatTime: (ms: number) => string;
}

export function Workspace({
  channels,
  activeChannelId,
  messages,
  stakeholders,
  stakeholderNames,
  playerName,
  world,
  unreadCounts,
  mentionCounts,
  pendingDecisionCounts,
  activePendingDecision,
  hasDecision,
  nudge,
  typingNames,
  gameClock,
  selectedProfileId,
  onChannelSelect,
  onMessageSubmit,
  onProfileOpen,
  onProfileClose,
  formatTime,
}: WorkspaceProps) {
  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const channelMessages = messages.filter(
    (m) => m.channel === activeChannelId
  );
  const activeDecisionCount = pendingDecisionCounts[activeChannelId] || 0;
  const selectedStakeholder = stakeholders.find((stakeholder) => stakeholder.id === selectedProfileId) ?? null;

  if (!activeChannel) return null;

  const visibleTypingNames =
    activeChannel.type === 'dm' && typingNames.length > 0
      ? [activeChannel.name.split(' ')[0]]
      : typingNames;

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-slack-bg">
      <Sidebar
        channels={channels}
        messages={messages}
        activeChannelId={activeChannelId}
        unreadCounts={unreadCounts}
        mentionCounts={mentionCounts}
        pendingDecisionCounts={pendingDecisionCounts}
        onChannelSelect={onChannelSelect}
        workspaceName={world.companyName}
        gameClock={gameClock}
        playerName={playerName}
      />
      <ChannelView
        channel={activeChannel}
        messages={channelMessages}
        stakeholders={stakeholders}
        stakeholderNames={stakeholderNames}
        playerName={playerName}
        hasDecision={hasDecision}
        decisionCount={activeDecisionCount}
        activePendingDecision={activePendingDecision}
        nudge={nudge}
        typingNames={visibleTypingNames}
        onMessageSubmit={onMessageSubmit}
        onProfileOpen={onProfileOpen}
        formatTime={formatTime}
      />
      <ProfilePanel stakeholder={selectedStakeholder} onClose={onProfileClose} />
    </div>
  );
}
