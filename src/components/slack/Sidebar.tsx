'use client';

import type { ChannelDef } from '@/engine/types';
import { Avatar } from './Avatar';

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
    <div className="w-[220px] bg-slack-sidebar flex flex-col shrink-0 h-full border-r border-white/5">
      {/* Workspace header */}
      <div className="h-[52px] border-b border-white/10 flex items-center px-4 shrink-0">
        <div className="flex items-center justify-between w-full">
          <span className="font-bold text-lg text-white truncate">{workspaceName}</span>
          <span className="text-xs text-slack-text-secondary tabular-nums font-mono">{gameClock}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {/* Channels section */}
        <div className="mb-3">
          <div className="px-4 py-1 text-xs text-slack-text-secondary font-semibold uppercase tracking-wide">
            Channels
          </div>
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
            <div className="px-4 py-1 text-xs text-slack-text-secondary font-semibold uppercase tracking-wide">
              Direct Messages
            </div>
            {dmChannels.map((channel) => (
              <DMItem
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
      className={`w-full text-left px-4 py-[3px] text-[15px] flex items-center justify-between
        transition-colors cursor-pointer
        ${isActive ? 'bg-slack-sidebar-active text-white' : 'hover:bg-slack-sidebar-hover'}
        ${hasUnread && !isActive ? 'text-white font-semibold' : ''}
        ${!hasUnread && !isActive ? 'text-slack-text-secondary' : ''}`}
    >
      <span className="truncate">
        <span className="mr-1 text-slack-text-secondary">#</span>
        {channel.name}
      </span>
      {hasMention && !isActive && (
        <span className="ml-2 bg-slack-badge-red text-white text-xs font-bold px-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full">
          {mentionCount}
        </span>
      )}
      {hasUnread && !hasMention && !isActive && (
        <span className="ml-2 w-2 h-2 bg-slack-text-secondary rounded-full shrink-0" />
      )}
    </button>
  );
}

function DMItem({
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
  const displayName = channel.name;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-[3px] text-[15px] flex items-center justify-between gap-2
        transition-colors cursor-pointer
        ${isActive ? 'bg-slack-sidebar-active text-white' : 'hover:bg-slack-sidebar-hover'}
        ${hasUnread && !isActive ? 'text-white font-semibold' : ''}
        ${!hasUnread && !isActive ? 'text-slack-text-secondary' : ''}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative shrink-0">
          <Avatar name={displayName} size="sm" />
          <div className="absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full bg-slack-presence-green border-[2px] border-slack-sidebar" />
        </div>
        <span className="truncate">{displayName}</span>
      </div>
      {hasMention && !isActive && (
        <span className="ml-1 bg-slack-badge-red text-white text-xs font-bold px-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full shrink-0">
          {mentionCount}
        </span>
      )}
      {hasUnread && !hasMention && !isActive && (
        <span className="ml-1 w-2 h-2 bg-slack-text-secondary rounded-full shrink-0" />
      )}
    </button>
  );
}
