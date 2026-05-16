'use client';

import { Message } from './Message';
import type { DeliveredMessage, Stakeholder } from '@/engine/types';

interface MessageGroupProps {
  messages: DeliveredMessage[];
  stakeholders: Stakeholder[];
  stakeholderNames: Record<string, string>;
  playerName: string;
  formatTime: (ms: number) => string;
  onProfileOpen?: (stakeholderId: string) => void;
}

/**
 * Groups consecutive messages from the same sender within 5 minutes.
 * Only the first message in a group shows the avatar and name header.
 */
export function MessageGroup({
  messages,
  stakeholders,
  stakeholderNames,
  playerName,
  formatTime,
  onProfileOpen,
}: MessageGroupProps) {
  const roleById: Record<string, string> = {};
  for (const s of stakeholders) roleById[s.id] = s.role;
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
              senderRole={msg.from === 'player' ? undefined : roleById[msg.from]}
              content={msg.content}
              timestamp={formatTime(msg.timestamp)}
              playerName={playerName}
              stakeholderNames={stakeholderNames}
              isPlayer={msg.isPlayerMessage}
              mentionsPlayer={msg.mentionsPlayer}
              showAvatar={idx === 0}
              showHeader={idx === 0}
              onProfileOpen={onProfileOpen}
            />
          );
        })
      )}
    </>
  );
}
