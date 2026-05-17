'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar } from './Avatar';
import type { ChannelDef } from '@/engine/types';

interface MessageProps {
  senderId: string | 'player';
  senderName: string;
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

  // Channel-wide pings — styled the same as @-mentions, never clickable.
  catalog.set('@channel', { stakeholderId: null });
  catalog.set('@here', { stakeholderId: null });

  catalog.set('@you', { stakeholderId: null });
  catalog.set('@player', { stakeholderId: null });
  const trimmedPlayer = playerName.trim();
  if (trimmedPlayer) {
    catalog.set(`@${trimmedPlayer}`, { stakeholderId: null });
    const firstName = trimmedPlayer.split(/\s+/)[0];
    if (firstName && firstName !== trimmedPlayer) {
      catalog.set(`@${firstName}`, { stakeholderId: null });
    }
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

type FormatNode =
  | { type: 'text'; value: string }
  | { type: 'bold'; children: FormatNode[] }
  | { type: 'italic'; children: FormatNode[] }
  | { type: 'strike'; children: FormatNode[] }
  | { type: 'code'; value: string };

const FORMAT_REGEX =
  /\*(?=\S)([^*\n]+?)(?<=\S)\*|_(?=\S)([^_\n]+?)(?<=\S)_|~(?=\S)([^~\n]+?)(?<=\S)~|`([^`\n]+?)`/g;

function parseFormatting(text: string): FormatNode[] {
  const nodes: FormatNode[] = [];
  let lastIndex = 0;
  const regex = new RegExp(FORMAT_REGEX.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const [token, bold, italic, strike, code] = match;
    if (bold !== undefined) {
      nodes.push({ type: 'bold', children: parseFormatting(bold) });
    } else if (italic !== undefined) {
      nodes.push({ type: 'italic', children: parseFormatting(italic) });
    } else if (strike !== undefined) {
      nodes.push({ type: 'strike', children: parseFormatting(strike) });
    } else if (code !== undefined) {
      nodes.push({ type: 'code', value: code });
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    nodes.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return nodes;
}

function renderInlineText(
  content: string,
  playerName: string,
  stakeholderNames: Record<string, string>,
  channels: ChannelDef[] | undefined,
  keyPrefix: string,
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
    const key = `${keyPrefix}-t${i}`;
    const lower = part.toLowerCase();
    const mention = mentions.get(part) || mentions.get(lower);
    const channelId = channelCatalog.get(part) || channelCatalog.get(lower);

    if (channelId) {
      const isClickable = Boolean(onChannelOpen);
      return (
        <button
          key={key}
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
          key={key}
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
    return <span key={key}>{part}</span>;
  });
}

function renderNodes(
  nodes: FormatNode[],
  playerName: string,
  stakeholderNames: Record<string, string>,
  channels: ChannelDef[] | undefined,
  keyPrefix: string,
  onProfileOpen?: (stakeholderId: string) => void,
  onChannelOpen?: (channelId: string) => void
): React.ReactNode {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    if (node.type === 'text') {
      return (
        <span key={key}>
          {renderInlineText(
            node.value,
            playerName,
            stakeholderNames,
            channels,
            key,
            onProfileOpen,
            onChannelOpen
          )}
        </span>
      );
    }
    if (node.type === 'code') {
      return (
        <code
          key={key}
          className="rounded border border-slack-divider bg-slack-composer-bg px-1 py-[1px] font-mono text-[12.5px] text-slack-mention-text"
        >
          {node.value}
        </code>
      );
    }
    const inner = renderNodes(
      node.children,
      playerName,
      stakeholderNames,
      channels,
      key,
      onProfileOpen,
      onChannelOpen
    );
    if (node.type === 'bold') {
      return (
        <strong key={key} className="font-bold">
          {inner}
        </strong>
      );
    }
    if (node.type === 'italic') {
      return (
        <em key={key} className="italic">
          {inner}
        </em>
      );
    }
    return (
      <span key={key} className="line-through">
        {inner}
      </span>
    );
  });
}

function renderContent(
  content: string,
  playerName: string,
  stakeholderNames: Record<string, string>,
  channels: ChannelDef[] | undefined,
  onProfileOpen?: (stakeholderId: string) => void,
  onChannelOpen?: (channelId: string) => void
): React.ReactNode {
  const nodes = parseFormatting(content);
  return renderNodes(
    nodes,
    playerName,
    stakeholderNames,
    channels,
    'm',
    onProfileOpen,
    onChannelOpen
  );
}

export function Message({
  senderId,
  senderName,
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
