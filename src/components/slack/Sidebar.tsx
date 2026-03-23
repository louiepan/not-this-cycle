'use client';

import { useMemo } from 'react';
import type { ChannelDef, DeliveredMessage } from '@/engine/types';
import { Avatar } from './Avatar';

interface SidebarProps {
  channels: ChannelDef[];
  messages: DeliveredMessage[];
  activeChannelId: string;
  unreadCounts: Record<string, number>;
  mentionCounts: Record<string, number>;
  onChannelSelect: (channelId: string) => void;
  workspaceName: string;
  gameClock: string;
}

export function Sidebar({
  channels,
  messages,
  activeChannelId,
  unreadCounts,
  mentionCounts,
  onChannelSelect,
  workspaceName,
  gameClock,
}: SidebarProps) {
  const publicChannels = useMemo(() => {
    const lastActivity = new Map<string, number>();
    for (const message of messages) {
      lastActivity.set(
        message.channel,
        Math.max(lastActivity.get(message.channel) ?? -1, message.timestamp)
      );
    }

    return channels
      .filter((c) => c.type === 'channel')
      .sort((a, b) => {
        const mentionDiff = (mentionCounts[b.id] || 0) - (mentionCounts[a.id] || 0);
        if (mentionDiff !== 0) return mentionDiff;

        const unreadDiff = (unreadCounts[b.id] || 0) - (unreadCounts[a.id] || 0);
        if (unreadDiff !== 0) return unreadDiff;

        const activityDiff = (lastActivity.get(b.id) ?? -1) - (lastActivity.get(a.id) ?? -1);
        if (activityDiff !== 0) return activityDiff;

        return channels.findIndex((channel) => channel.id === a.id) -
          channels.findIndex((channel) => channel.id === b.id);
      });
  }, [channels, mentionCounts, messages, unreadCounts]);
  const dmChannels = channels.filter((c) => c.type === 'dm');

  return (
    <div className="flex h-full w-[220px] shrink-0 flex-col border-r border-white/8 bg-slack-sidebar sm:w-[250px] lg:w-[276px]">
      {/* Workspace header */}
      <div className="flex h-[52px] shrink-0 items-center border-b border-white/10 px-4 md:h-[50px]">
        <div className="flex items-center justify-between w-full">
          <span className="truncate text-[17px] font-bold text-white">{workspaceName}</span>
          <span className="font-mono text-[11px] tabular-nums text-slack-text-secondary md:hidden">{gameClock}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {/* Channels section */}
        <div className="mb-4">
          <div className="px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slack-text-secondary/80">
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
            <div className="px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slack-text-secondary/80">
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
      className={`flex w-full items-center justify-between px-4 py-[7px] text-left text-[15px]
        transition-colors cursor-pointer
        ${isActive ? 'bg-slack-sidebar-active/95 text-white shadow-[inset_3px_0_0_rgba(255,255,255,0.18)]' : 'hover:bg-slack-sidebar-hover'}
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
      className={`flex w-full items-center justify-between gap-2 px-4 py-[7px] text-left text-[15px]
        transition-colors cursor-pointer
        ${isActive ? 'bg-slack-sidebar-active/95 text-white shadow-[inset_3px_0_0_rgba(255,255,255,0.18)]' : 'hover:bg-slack-sidebar-hover'}
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
