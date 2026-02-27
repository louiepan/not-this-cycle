'use client';

import type { ChannelDef, DeliveredMessage, Choice } from '@/engine/types';
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
  choices: Choice[] | null;
  typingNames: string[];
  gameClock: string;
  onChannelSelect: (channelId: string) => void;
  onChoiceSelect: (choice: Choice) => void;
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
  choices,
  typingNames,
  gameClock,
  onChannelSelect,
  onChoiceSelect,
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
        choices={choices}
        typingNames={typingNames}
        onChoiceSelect={onChoiceSelect}
        formatTime={formatTime}
      />
    </div>
  );
}
