'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar } from './Avatar';

interface MessageProps {
  senderId: string | 'player';
  senderName: string;
  content: string;
  timestamp: string;
  playerName: string;
  stakeholderNames: Record<string, string>;
  isPlayer?: boolean;
  mentionsPlayer?: boolean;
  showAvatar?: boolean;
  showHeader?: boolean;
  animate?: boolean;
  onProfileOpen?: (stakeholderId: string) => void;
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

function renderContent(
  content: string,
  playerName: string,
  stakeholderNames: Record<string, string>,
  onProfileOpen?: (stakeholderId: string) => void
): React.ReactNode {
  const catalog = buildMentionCatalog(playerName, stakeholderNames);
  const tokens = Array.from(catalog.keys()).sort((a, b) => b.length - a.length);
  if (tokens.length === 0) return content;

  const regex = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const parts = content.split(regex);
  if (parts.length === 1) return content;

  return parts.map((part, i) => {
    const meta = catalog.get(part) || catalog.get(part.toLowerCase());

    if (part === '@channel' || part === '@here' || meta) {
      const stakeholderId = meta?.stakeholderId ?? null;
      const isClickable = stakeholderId !== null && Boolean(onProfileOpen);
      const isPlayerMention =
        part.toLowerCase() === '@you' ||
        part.toLowerCase() === '@player' ||
        (playerName.trim() && part.toLowerCase() === `@${playerName.toLowerCase()}`);
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
  content,
  timestamp,
  playerName,
  stakeholderNames,
  isPlayer = false,
  mentionsPlayer = false,
  showAvatar = true,
  showHeader = true,
  animate = true,
  onProfileOpen,
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
      className={`group flex gap-3 px-5 py-1 transition-all duration-300
        ${showHeader ? 'mt-4' : ''}
        ${mentionsPlayer ? 'bg-slack-mention-bg/30 border-l-2 border-slack-mention-text' : 'hover:bg-slack-message-hover'}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
    >
      {showAvatar ? (
        <Avatar name={displayName} size="md" />
      ) : (
        <div className="w-9 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        {showHeader && (
          <div className="flex items-baseline gap-2">
            <button
              type="button"
              onClick={() => {
                if (canOpenProfile && onProfileOpen) onProfileOpen(senderId);
              }}
              className={`font-bold text-[15px] text-slack-white ${
                canOpenProfile ? 'cursor-pointer hover:underline' : 'cursor-default'
              }`}
            >
              {displayName}
            </button>
            <span className="text-xs text-slack-text-secondary">{timestampLabel}</span>
          </div>
        )}
        <div className="text-slack-text text-[15px] whitespace-pre-wrap break-words">
          {renderContent(content, playerName, stakeholderNames, onProfileOpen)}
        </div>
      </div>
    </div>
  );
}
