'use client';

import type { ChannelDef } from '@/engine/types';

interface SidebarProps {
  channels: ChannelDef[];
  activeChannelId: string;
  unreadCounts: Record<string, number>;
  mentionCounts: Record<string, number>;
  onChannelSelect: (channelId: string) => void;
  workspaceName: string;
  gameClock: string;
}

export function Sidebar({
  channels,
  activeChannelId,
  unreadCounts,
  mentionCounts,
  onChannelSelect,
  workspaceName,
  gameClock,
}: SidebarProps) {
  const publicChannels = channels.filter((c) => c.type === 'channel');
  const dmChannels = channels.filter((c) => c.type === 'dm');

  return (
    <div className="w-60 bg-slack-sidebar flex flex-col shrink-0 h-full">
      {/* Workspace header */}
      <div className="h-12 border-b border-white/10 flex items-center px-4 shrink-0">
        <div className="flex items-center justify-between w-full">
          <span className="font-bold text-lg text-white truncate">{workspaceName}</span>
          <span className="text-xs text-slack-text-secondary tabular-nums">{gameClock}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {/* Channels section */}
        <div className="mb-4">
          <button className="w-full text-left px-4 py-0.5 text-sm text-slack-text-secondary hover:text-slack-text flex items-center gap-1">
            <span className="text-xs">▾</span>
            <span className="font-semibold">Channels</span>
          </button>
          {publicChannels.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeChannelId}
              unreadCount={unreadCounts[channel.id] || 0}
              mentionCount={mentionCounts[channel.id] || 0}
              onSelect={() => onChannelSelect(channel.id)}
            />
          ))}
        </div>

        {/* DMs section */}
        {dmChannels.length > 0 && (
          <div>
            <button className="w-full text-left px-4 py-0.5 text-sm text-slack-text-secondary hover:text-slack-text flex items-center gap-1">
              <span className="text-xs">▾</span>
              <span className="font-semibold">Direct Messages</span>
            </button>
            {dmChannels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={channel.id === activeChannelId}
                unreadCount={unreadCounts[channel.id] || 0}
                mentionCount={mentionCounts[channel.id] || 0}
                onSelect={() => onChannelSelect(channel.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChannelItem({
  channel,
  isActive,
  unreadCount,
  mentionCount,
  onSelect,
}: {
  channel: ChannelDef;
  isActive: boolean;
  unreadCount: number;
  mentionCount: number;
  onSelect: () => void;
}) {
  const hasUnread = unreadCount > 0;
  const hasMention = mentionCount > 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-0.5 text-[15px] flex items-center justify-between
        transition-colors cursor-pointer group
        ${isActive ? 'bg-slack-sidebar-active text-white' : 'hover:bg-slack-sidebar-hover'}
        ${hasUnread && !isActive ? 'text-white font-bold' : ''}
        ${!hasUnread && !isActive ? 'text-slack-text-secondary' : ''}`}
    >
      <span className="truncate">
        {channel.type === 'dm' ? '' : '# '}
        {channel.name}
      </span>
      {hasMention && !isActive && (
        <span className="ml-2 bg-slack-badge-red text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {mentionCount}
        </span>
      )}
      {hasUnread && !hasMention && !isActive && (
        <span className="ml-2 w-2 h-2 bg-slack-badge-gray rounded-full shrink-0" />
      )}
    </button>
  );
}
