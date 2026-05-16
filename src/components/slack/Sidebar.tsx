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
  pendingDecisionCounts: Record<string, number>;
  onChannelSelect: (channelId: string) => void;
  workspaceName: string;
  gameClock: string;
  playerName: string;
  playerRole?: string;
}

export function Sidebar({
  channels,
  messages,
  activeChannelId,
  unreadCounts,
  mentionCounts,
  pendingDecisionCounts,
  onChannelSelect,
  workspaceName,
  gameClock,
  playerName,
  playerRole = 'Senior PM · Growth',
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
    <div className="flex h-full w-[232px] shrink-0 flex-col border-r border-slack-divider bg-slack-sidebar">
      {/* Workspace header */}
      <div className="flex h-[52px] shrink-0 items-center justify-between gap-2 border-b border-slack-divider px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[5px] text-[11px] font-extrabold tracking-[-0.04em] text-[#1a0e07]"
            style={{ background: 'linear-gradient(135deg, #e8915a, #c26b3d)' }}
          >
            {workspaceName.charAt(0)}
          </div>
          <span className="truncate text-[14px] font-semibold tracking-[-0.01em] text-slack-text">
            {workspaceName}
          </span>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-slack-text-secondary">{gameClock}</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Channels section */}
        <div className="mb-3">
          <div className="px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-slack-text-secondary">
            Channels
          </div>
          {publicChannels.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeChannelId}
              unreadCount={unreadCounts[channel.id] || 0}
              mentionCount={mentionCounts[channel.id] || 0}
              pendingDecisionCount={pendingDecisionCounts[channel.id] || 0}
              onSelect={() => onChannelSelect(channel.id)}
            />
          ))}
        </div>

        {/* DMs section */}
        {dmChannels.length > 0 && (
          <div>
            <div className="px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-slack-text-secondary">
              Direct messages
            </div>
            {dmChannels.map((channel) => (
              <DMItem
                key={channel.id}
                channel={channel}
                isActive={channel.id === activeChannelId}
                unreadCount={unreadCounts[channel.id] || 0}
                mentionCount={mentionCounts[channel.id] || 0}
                pendingDecisionCount={pendingDecisionCounts[channel.id] || 0}
                onSelect={() => onChannelSelect(channel.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2.5 border-t border-slack-divider px-3 py-2.5">
        <Avatar name={playerName || 'You'} size="md" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[12.5px] font-semibold text-slack-text">
            {playerName || 'You'}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-slack-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-slack-presence-green" />
            {playerRole}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelItem({
  channel,
  isActive,
  unreadCount,
  mentionCount,
  pendingDecisionCount,
  onSelect,
}: {
  channel: ChannelDef;
  isActive: boolean;
  unreadCount: number;
  mentionCount: number;
  pendingDecisionCount: number;
  onSelect: () => void;
}) {
  const hasUnread = unreadCount > 0;
  const hasMention = mentionCount > 0;
  const hasPendingDecision = pendingDecisionCount > 0;

  return (
    <button
      onClick={onSelect}
      style={isActive ? { boxShadow: 'inset 2px 0 0 var(--color-slack-link)' } : undefined}
      className={`mx-2 flex h-[26px] w-[calc(100%-16px)] items-center gap-2 rounded-md px-2 text-left text-[13px] leading-none transition-colors cursor-pointer
        ${isActive ? 'bg-slack-sidebar-active text-slack-text font-medium' : 'hover:bg-slack-sidebar-hover'}
        ${hasUnread && !isActive ? 'text-slack-text font-medium' : ''}
        ${!hasUnread && !isActive ? 'text-slack-text-muted' : ''}`}
    >
      <span className="flex-1 truncate">
        <span className={`mr-1 ${isActive ? 'text-slack-text-muted' : 'text-slack-text-secondary'}`}>#</span>
        {channel.name}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        {hasPendingDecision && !isActive && <DecisionBadge count={pendingDecisionCount} />}
        {hasMention && !isActive && <MentionBadge count={mentionCount} />}
        {hasUnread && !hasMention && !hasPendingDecision && !isActive && (
          <span className="h-1.5 w-1.5 rounded-full bg-slack-text-secondary" />
        )}
      </div>
    </button>
  );
}

function DMItem({
  channel,
  isActive,
  unreadCount,
  mentionCount,
  pendingDecisionCount,
  onSelect,
}: {
  channel: ChannelDef;
  isActive: boolean;
  unreadCount: number;
  mentionCount: number;
  pendingDecisionCount: number;
  onSelect: () => void;
}) {
  const hasUnread = unreadCount > 0;
  const hasMention = mentionCount > 0;
  const hasPendingDecision = pendingDecisionCount > 0;
  const displayName = channel.name;

  return (
    <button
      onClick={onSelect}
      style={isActive ? { boxShadow: 'inset 2px 0 0 var(--color-slack-link)' } : undefined}
      className={`mx-2 flex h-[26px] w-[calc(100%-16px)] items-center gap-2.5 rounded-md px-2 text-left text-[13px] leading-none transition-colors cursor-pointer
        ${isActive ? 'bg-slack-sidebar-active text-slack-text font-medium' : 'hover:bg-slack-sidebar-hover'}
        ${hasUnread && !isActive ? 'text-slack-text font-medium' : ''}
        ${!hasUnread && !isActive ? 'text-slack-text-muted' : ''}`}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          name={displayName}
          id={channel.id.startsWith('dm-') ? channel.id.replace(/^dm-/, 'the-') : undefined}
          size="sm"
        />
        <div className="absolute -bottom-px -right-px h-2 w-2 rounded-full bg-slack-presence-green ring-2 ring-slack-sidebar" />
      </div>
      <span className="flex-1 truncate">{displayName}</span>
      <div className="flex shrink-0 items-center gap-1.5">
        {hasPendingDecision && !isActive && <DecisionBadge count={pendingDecisionCount} />}
        {hasMention && !isActive && <MentionBadge count={mentionCount} />}
        {hasUnread && !hasMention && !hasPendingDecision && !isActive && (
          <span className="h-1.5 w-1.5 rounded-full bg-slack-text-secondary" />
        )}
      </div>
    </button>
  );
}

function MentionBadge({ count }: { count: number }) {
  return (
    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slack-link px-1.5 text-[10.5px] font-bold tabular-nums text-[#1a0e07]">
      {count}
    </span>
  );
}

function DecisionBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[3px] border border-slack-choice-border/40 bg-slack-choice-bg px-1.5 py-[2px] text-[10px] font-bold uppercase tracking-[0.02em] text-slack-link">
      <span className="h-[4px] w-[4px] rotate-45 bg-slack-link" />
      {count}
    </span>
  );
}
