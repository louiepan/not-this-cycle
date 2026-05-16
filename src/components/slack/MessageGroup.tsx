'use client';

import { Message } from './Message';
import type { ChannelDef, DeliveredMessage } from '@/engine/types';

interface MessageGroupProps {
  messages: DeliveredMessage[];
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
 */
export function MessageGroup({
  messages,
  stakeholderNames,
  playerName,
  channels,
  formatTime,
  onProfileOpen,
  onChannelOpen,
}: MessageGroupProps) {
  if (messages.length === 0) return null;

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

  return (
    <>
      {groups.map((group) =>
        group.messages.map((msg, idx) => {
          const senderName =
            msg.from === 'player'
              ? playerName
              : stakeholderNames[msg.from] || msg.from;
          return (
            <Message
              key={msg.id}
              senderId={msg.from}
              senderName={senderName}
              content={msg.content}
              timestamp={formatTime(msg.timestamp)}
              playerName={playerName}
              stakeholderNames={stakeholderNames}
              channels={channels}
              isPlayer={msg.isPlayerMessage}
              mentionsPlayer={msg.mentionsPlayer}
              showAvatar={idx === 0}
              showHeader={idx === 0}
              onProfileOpen={onProfileOpen}
              onChannelOpen={onChannelOpen}
            />
          );
        })
      )}
    </>
  );
}
