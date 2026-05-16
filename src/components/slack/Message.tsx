'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar } from './Avatar';
import type { ChannelDef } from '@/engine/types';

interface MessageProps {
  senderId: string | 'player';
  senderName: string;
  senderRole?: string;
  content: string;
  timestamp: string;
  playerName: string;
  stakeholderNames: Record<string, string>;
  channels?: ChannelDef[];
  isPlayer?: boolean;
  mentionsPlayer?: boolean;
  showAvatar?: boolean;
  showHeader?: boolean;
  animate?: boolean;
  onProfileOpen?: (stakeholderId: string) => void;
  onChannelOpen?: (channelId: string) => void;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildMentionCatalog(
  playerName: string,
  stakeholderNames: Record<string, string>
) {
  const catalog = new Map<string, { stakeholderId: string | null }>();

  catalog.set('@you', { stakeholderId: null });
  catalog.set('@player', { stakeholderId: null });
  if (playerName.trim()) {
    catalog.set(`@${playerName}`, { stakeholderId: null });
  }

  for (const [stakeholderId, name] of Object.entries(stakeholderNames)) {
    const firstName = name.split(' ')[0];
    catalog.set(`@${name}`, { stakeholderId });
    catalog.set(`@${firstName}`, { stakeholderId });
  }

  return catalog;
}

function buildChannelCatalog(channels: ChannelDef[] | undefined) {
  const catalog = new Map<string, string>();
  if (!channels) return catalog;
  for (const channel of channels) {
    if (channel.type !== 'channel') continue;
    catalog.set(`#${channel.id}`, channel.id);
    if (channel.name !== channel.id) {
      catalog.set(`#${channel.name}`, channel.id);
    }
  }
  return catalog;
}

function renderContent(
  content: string,
  playerName: string,
  stakeholderNames: Record<string, string>,
  channels: ChannelDef[] | undefined,
  onProfileOpen?: (stakeholderId: string) => void,
  onChannelOpen?: (channelId: string) => void
): React.ReactNode {
  const mentions = buildMentionCatalog(playerName, stakeholderNames);
  const channelCatalog = buildChannelCatalog(channels);
  const tokens = [
    ...Array.from(mentions.keys()),
    ...Array.from(channelCatalog.keys()),
  ].sort((a, b) => b.length - a.length);
  if (tokens.length === 0) return content;

  const regex = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const parts = content.split(regex);
  if (parts.length === 1) return content;

  return parts.map((part, i) => {
    const lower = part.toLowerCase();
    const mention = mentions.get(part) || mentions.get(lower);
    const channelId = channelCatalog.get(part) || channelCatalog.get(lower);

    if (channelId) {
      const isClickable = Boolean(onChannelOpen);
      return (
        <button
          key={i}
          type="button"
          onClick={() => {
            if (onChannelOpen) onChannelOpen(channelId);
          }}
          className={`rounded px-0.5 font-medium ${
            isClickable
              ? 'cursor-pointer bg-slack-mention-bg/40 text-slack-link hover:bg-slack-mention-bg/70 hover:underline'
              : 'bg-slack-mention-bg/30 text-slack-link'
          }`}
        >
          {part}
        </button>
      );
    }

    if (part === '@channel' || part === '@here' || mention) {
      const stakeholderId = mention?.stakeholderId ?? null;
      const isClickable = stakeholderId !== null && Boolean(onProfileOpen);
      const isPlayerMention =
        lower === '@you' ||
        lower === '@player' ||
        (playerName.trim() && lower === `@${playerName.toLowerCase()}`);
      const displayPart =
        isPlayerMention && playerName.trim() ? `@${playerName}` : part;

      return (
        <button
          key={i}
          type="button"
          onClick={() => {
            if (stakeholderId && onProfileOpen) onProfileOpen(stakeholderId);
          }}
          className={`rounded px-0.5 ${
            isClickable
              ? 'cursor-pointer bg-slack-mention-bg/70 text-slack-mention-text hover:bg-slack-mention-bg/90'
              : 'bg-slack-mention-bg/60 text-slack-mention-text'
          }`}
        >
          {displayPart}
        </button>
      );
    }
    return part;
  });
}

export function Message({
  senderId,
  senderName,
  senderRole,
  content,
  timestamp,
  playerName,
  stakeholderNames,
  channels,
  isPlayer = false,
  mentionsPlayer = false,
  showAvatar = true,
  showHeader = true,
  animate = true,
  onProfileOpen,
  onChannelOpen,
}: MessageProps) {
  const [visible, setVisible] = useState(!animate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animate) {
      requestAnimationFrame(() => setVisible(true));
    }
  }, [animate]);

  const displayName = isPlayer ? senderName : senderName;
  const timestampLabel = isPlayer ? `${timestamp} (PM)` : timestamp;
  const canOpenProfile = !isPlayer && senderId !== 'player' && Boolean(onProfileOpen);

  return (
    <div
      ref={ref}
      className={`group flex gap-3 px-5 py-[2px] transition-all duration-300
        ${showHeader ? 'mt-3' : ''}
        ${mentionsPlayer ? 'bg-slack-mention-bg/30 border-l-2 border-slack-mention-text' : 'hover:bg-slack-message-hover'}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
    >
      {showAvatar ? (
        <Avatar name={displayName} id={isPlayer ? 'player' : senderId} size="md" />
      ) : (
        <div className="w-8 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        {showHeader && (
          <div className="mb-0.5 flex items-baseline gap-2">
            <button
              type="button"
              onClick={() => {
                if (canOpenProfile && onProfileOpen) onProfileOpen(senderId);
              }}
              className={`text-[13.5px] font-semibold tracking-[-0.005em] text-slack-text ${
                canOpenProfile ? 'cursor-pointer hover:underline' : 'cursor-default'
              }`}
            >
              {displayName}
            </button>
            {senderRole && !isPlayer && (
              <span className="text-[11px] font-normal text-slack-text-secondary">{senderRole}</span>
            )}
            <span className="text-[11px] text-slack-text-secondary">{timestampLabel}</span>
          </div>
        )}
        <div className="text-slack-text text-[14px] leading-[1.55] whitespace-pre-wrap break-words">
          {renderContent(content, playerName, stakeholderNames, channels, onProfileOpen, onChannelOpen)}
        </div>
      </div>
    </div>
  );
}
