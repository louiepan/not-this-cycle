'use client';

import { Fragment } from 'react';
import { Message } from './Message';
import type { ChannelDef, DeliveredMessage, Stakeholder } from '@/engine/types';

interface MessageGroupProps {
  messages: DeliveredMessage[];
  stakeholders: Stakeholder[];
  stakeholderNames: Record<string, string>;
  playerName: string;
  channels?: ChannelDef[];
  formatTime: (ms: number) => string;
  onProfileOpen?: (stakeholderId: string) => void;
  onChannelOpen?: (channelId: string) => void;
}

/**
 * Groups consecutive messages from the same sender within 5 minutes.
 * Only the first message in a group shows the avatar and name header.
 *
 * Renders an "Earlier today" divider at the transition from historical
 * scrollback to live messages so the player can tell what's backstory
 * from what's happening now.
 */
export function MessageGroup({
  messages,
  stakeholders,
  stakeholderNames,
  playerName,
  channels,
  formatTime,
  onProfileOpen,
  onChannelOpen,
}: MessageGroupProps) {
  if (messages.length === 0) return null;

  const roleById: Record<string, string> = {};
  for (const s of stakeholders) roleById[s.id] = s.role;

  const groups: { senderId: string; messages: DeliveredMessage[] }[] = [];

  for (const msg of messages) {
    const last = groups[groups.length - 1];
    const timeDiff = last
      ? msg.timestamp - last.messages[last.messages.length - 1].timestamp
      : Infinity;

    if (last && last.senderId === msg.from && timeDiff < 300000) {
      last.messages.push(msg);
    } else {
      groups.push({ senderId: msg.from, messages: [msg] });
    }
  }

  // Find the index of the first message that is NOT history. If all messages
  // are history (or all live), we render no divider — only when there's a
  // genuine transition.
  const firstLiveIndex = messages.findIndex((m) => !m.isHistory);
  const hasMixedHistoryAndLive =
    firstLiveIndex > 0 && messages.slice(0, firstLiveIndex).some((m) => m.isHistory);
  const firstLiveMessageId = hasMixedHistoryAndLive
    ? messages[firstLiveIndex].id
    : null;

  return (
    <>
      {groups.map((group) =>
        group.messages.map((msg, idx) => {
          const senderName =
            msg.from === 'player'
              ? playerName
              : stakeholderNames[msg.from] || msg.from;
          const showDividerBefore = msg.id === firstLiveMessageId;
          return (
            <Fragment key={msg.id}>
              {showDividerBefore && <NowDivider />}
              <Message
                senderId={msg.from}
                senderName={senderName}
                senderRole={msg.from === 'player' ? undefined : roleById[msg.from]}
                content={msg.content}
                timestamp={formatTime(msg.timestamp)}
                playerName={playerName}
                stakeholderNames={stakeholderNames}
                channels={channels}
                isPlayer={msg.isPlayerMessage}
                mentionsPlayer={msg.mentionsPlayer}
                showAvatar={idx === 0}
                showHeader={idx === 0}
                isHistory={msg.isHistory}
                onProfileOpen={onProfileOpen}
                onChannelOpen={onChannelOpen}
              />
            </Fragment>
          );
        })
      )}
    </>
  );
}

function NowDivider() {
  return (
    <div className="flex items-center gap-3 px-5 pb-2 pt-4">
      <div className="h-px flex-1 bg-slack-divider" />
      <span className="rounded-full border border-slack-divider bg-slack-sidebar-active px-3 py-[3px] text-[11px] font-semibold uppercase tracking-[0.06em] text-slack-text-secondary">
        New · this morning
      </span>
      <div className="h-px flex-1 bg-slack-divider" />
    </div>
  );
}
