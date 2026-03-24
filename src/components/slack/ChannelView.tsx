'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type { ChannelDef, DeliveredMessage, PendingDecision, Stakeholder } from '@/engine/types';
import { ChannelHeader } from './ChannelHeader';
import { MessageGroup } from './MessageGroup';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';
import { UnreadBanner } from './UnreadBanner';

interface ChannelViewProps {
  channel: ChannelDef;
  messages: DeliveredMessage[];
  stakeholders: Stakeholder[];
  stakeholderNames: Record<string, string>;
  playerName: string;
  hasDecision: boolean;
  decisionCount: number;
  activePendingDecision: PendingDecision | null;
  nudge: string | null;
  typingNames: string[];
  onMessageSubmit: (text: string) => void;
  onProfileOpen?: (stakeholderId: string) => void;
  formatTime: (ms: number) => string;
}

export function ChannelView({
  channel,
  messages,
  stakeholders,
  stakeholderNames,
  playerName,
  hasDecision,
  decisionCount,
  activePendingDecision,
  nudge,
  typingNames,
  onMessageSubmit,
  onProfileOpen,
  formatTime,
}: ChannelViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const previousChannelIdRef = useRef(channel.id);
  const previousMessageCountRef = useRef(messages.length);
  const [unseenCount, setUnseenCount] = useState(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior,
    });
    isNearBottomRef.current = true;
    setUnseenCount(0);
  }, []);

  useEffect(() => {
    if (previousChannelIdRef.current !== channel.id) {
      previousChannelIdRef.current = channel.id;
      previousMessageCountRef.current = messages.length;

      requestAnimationFrame(() => {
        scrollToBottom('auto');
      });
      return;
    }

    const previousMessageCount = previousMessageCountRef.current;
    const incomingMessages = messages.slice(previousMessageCount);
    const incomingNonPlayerCount = incomingMessages.filter((message) => !message.isPlayerMessage).length;

    if (incomingMessages.length > 0) {
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => {
          scrollToBottom('auto');
        });
      } else if (incomingNonPlayerCount > 0) {
        setUnseenCount((count) => count + incomingNonPlayerCount);
      }
    }

    previousMessageCountRef.current = messages.length;
  }, [channel.id, messages, scrollToBottom]);

  const decisionSourceMessage = [...messages]
    .reverse()
    .find(
      (message) =>
        !message.isPlayerMessage &&
        activePendingDecision !== null &&
        message.eventId === activePendingDecision.eventId
    );
  const decisionTargetName =
    hasDecision && decisionSourceMessage
      ? stakeholderNames[decisionSourceMessage.from]?.split(' ')[0] || null
      : null;

  function handleScroll() {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    isNearBottomRef.current = isNearBottom;

    if (isNearBottom && unseenCount > 0) {
      setUnseenCount(0);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-slack-channel-bg min-w-0 relative">
      <ChannelHeader channel={channel} />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {/* Today divider */}
        <div className="flex items-center px-6 py-5">
          <div className="flex-1 h-px bg-slack-divider" />
          <span className="px-4 text-xs font-bold text-slack-text-secondary">Today</span>
          <div className="flex-1 h-px bg-slack-divider" />
        </div>

        <MessageGroup
          messages={messages}
          stakeholderNames={stakeholderNames}
          playerName={playerName}
          formatTime={formatTime}
          onProfileOpen={onProfileOpen}
        />
        {messages.length === 0 && typingNames.length === 0 && (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-slack-text-secondary">
              Quiet channel. The next ping should land shortly.
            </p>
          </div>
        )}
        <TypingIndicator names={typingNames} />
      </div>

      <div className="relative border-t border-white/6 bg-[#1f2023] px-0 pb-1 pt-2">
        <UnreadBanner count={unseenCount} onClick={() => scrollToBottom('smooth')} />
        <MessageComposer
          channelName={channel.name}
          channelType={channel.type}
          stakeholders={stakeholders}
          hasDecision={hasDecision}
          decisionCount={decisionCount}
          decisionTargetName={decisionTargetName}
          nudge={nudge}
          onSubmit={onMessageSubmit}
        />
      </div>
    </div>
  );
}
