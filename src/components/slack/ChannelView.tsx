'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type { ChannelDef, DeliveredMessage, PendingDecision, Stakeholder } from '@/engine/types';
import { ChannelHeader } from './ChannelHeader';
import { MessageGroup } from './MessageGroup';
import { MessageComposer } from './MessageComposer';
import { UnreadBanner } from './UnreadBanner';

interface ChannelViewProps {
  channel: ChannelDef;
  channels?: ChannelDef[];
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
  onChannelOpen?: (channelId: string) => void;
  formatTime: (ms: number) => string;
}

export function ChannelView({
  channel,
  channels,
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
  onChannelOpen,
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
        <div className="flex items-center gap-3 px-5 pb-2 pt-4">
          <div className="h-px flex-1 bg-slack-divider" />
          <span className="rounded-full border border-slack-divider bg-slack-sidebar-active px-3 py-[3px] text-[11px] font-semibold uppercase tracking-[0.06em] text-slack-text-secondary">
            Today
          </span>
          <div className="h-px flex-1 bg-slack-divider" />
        </div>

        <MessageGroup
          messages={messages}
          stakeholderNames={stakeholderNames}
          playerName={playerName}
          channels={channels}
          formatTime={formatTime}
          onProfileOpen={onProfileOpen}
          onChannelOpen={onChannelOpen}
        />
        {messages.length === 0 && typingNames.length === 0 && (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-slack-text-secondary">
              Quiet channel. The next ping should land shortly.
            </p>
          </div>
        )}
      </div>

      <div className="relative bg-slack-channel-bg pb-1 pt-2">
        <UnreadBanner count={unseenCount} onClick={() => scrollToBottom('smooth')} />
        {typingNames.length > 0 && !channel.readOnly && (
          <div
            className="absolute left-9 z-10 inline-flex h-[22px] items-center gap-2 rounded-[11px] border border-slack-composer-border bg-slack-sidebar-active px-2.5 py-1 text-[11.5px] leading-none text-slack-text-muted"
            style={{ top: '-12px', boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}
          >
            <span className="flex items-center gap-[3px]">
              <span className="typing-dot" style={{ background: 'var(--color-slack-link)' }} />
              <span className="typing-dot [animation-delay:150ms]" style={{ background: 'var(--color-slack-link)' }} />
              <span className="typing-dot [animation-delay:300ms]" style={{ background: 'var(--color-slack-link)' }} />
            </span>
            <span className="font-semibold text-slack-text">{typingNames[0]}</span>
            <span className="text-slack-text-secondary">is typing…</span>
          </div>
        )}
        {channel.readOnly ? (
          <div className="mx-5 mb-3 mt-1 flex items-center gap-2 rounded-md border border-slack-composer-border bg-slack-sidebar-active px-3.5 py-2.5 text-[12.5px] text-slack-text-secondary">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M4 6V4.5a3 3 0 016 0V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <rect x="2.75" y="6" width="8.5" height="6" rx="1.25" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            <span>Only admins can post in <span className="font-semibold text-slack-text">#{channel.name}</span>.</span>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
