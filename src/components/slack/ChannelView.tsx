'use client';

import { useRef, useEffect } from 'react';
import type { ChannelDef, DeliveredMessage, Choice } from '@/engine/types';
import { ChannelHeader } from './ChannelHeader';
import { MessageGroup } from './MessageGroup';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';

interface ChannelViewProps {
  channel: ChannelDef;
  messages: DeliveredMessage[];
  stakeholderNames: Record<string, string>;
  playerName: string;
  choices: Choice[] | null;
  typingNames: string[];
  onChoiceSelect: (choice: Choice) => void;
  formatTime: (ms: number) => string;
}

export function ChannelView({
  channel,
  messages,
  stakeholderNames,
  playerName,
  choices,
  typingNames,
  onChoiceSelect,
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
        className="flex-1 overflow-y-auto py-2"
      >
        <MessageGroup
          messages={messages}
          stakeholderNames={stakeholderNames}
          playerName={playerName}
          formatTime={formatTime}
        />
        <TypingIndicator names={typingNames} />
      </div>

      <MessageComposer
        channelName={channel.name}
        choices={choices}
        onChoiceSelect={onChoiceSelect}
      />
    </div>
  );
}
