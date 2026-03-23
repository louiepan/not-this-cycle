'use client';

import { useRef, useEffect } from 'react';
import type { ChannelDef, DeliveredMessage, Stakeholder } from '@/engine/types';
import { ChannelHeader } from './ChannelHeader';
import { MessageGroup } from './MessageGroup';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';

interface ChannelViewProps {
  channel: ChannelDef;
  messages: DeliveredMessage[];
  stakeholders: Stakeholder[];
  stakeholderNames: Record<string, string>;
  playerName: string;
  hasDecision: boolean;
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
  nudge,
  typingNames,
  onMessageSubmit,
  onProfileOpen,
  formatTime,
}: ChannelViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    if (isNearBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  function handleScroll() {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
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

      <div className="border-t border-white/6 bg-[#1f2023] px-0 pb-1 pt-2">
        <MessageComposer
          channelName={channel.name}
          channelType={channel.type}
          stakeholders={stakeholders}
          hasDecision={hasDecision}
          nudge={nudge}
          onSubmit={onMessageSubmit}
        />
      </div>
    </div>
  );
}
