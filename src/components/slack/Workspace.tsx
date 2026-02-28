'use client';

import type { ChannelDef, DeliveredMessage } from '@/engine/types';
import { Sidebar } from './Sidebar';
import { ChannelView } from './ChannelView';

interface WorkspaceProps {
  channels: ChannelDef[];
  activeChannelId: string;
  messages: DeliveredMessage[];
  stakeholderNames: Record<string, string>;
  playerName: string;
  unreadCounts: Record<string, number>;
  mentionCounts: Record<string, number>;
  hasDecision: boolean;
  nudge: string | null;
  typingNames: string[];
  gameClock: string;
  onChannelSelect: (channelId: string) => void;
  onMessageSubmit: (text: string) => void;
  formatTime: (ms: number) => string;
}

export function Workspace({
  channels,
  activeChannelId,
  messages,
  stakeholderNames,
  playerName,
  unreadCounts,
  mentionCounts,
  hasDecision,
  nudge,
  typingNames,
  gameClock,
  onChannelSelect,
  onMessageSubmit,
  formatTime,
}: WorkspaceProps) {
  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const channelMessages = messages.filter(
    (m) => m.channel === activeChannelId
  );

  if (!activeChannel) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        channels={channels}
        activeChannelId={activeChannelId}
        unreadCounts={unreadCounts}
        mentionCounts={mentionCounts}
        onChannelSelect={onChannelSelect}
        workspaceName="TechCorp HQ"
        gameClock={gameClock}
      />
      <ChannelView
        channel={activeChannel}
        messages={channelMessages}
        stakeholderNames={stakeholderNames}
        playerName={playerName}
        hasDecision={hasDecision}
        nudge={nudge}
        typingNames={typingNames}
        onMessageSubmit={onMessageSubmit}
        formatTime={formatTime}
      />
    </div>
  );
}
