'use client';

import { useState, useRef, useEffect } from 'react';

interface MessageComposerProps {
  channelName: string;
  channelType: 'channel' | 'dm';
  hasDecision: boolean;
  nudge: string | null;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function MessageComposer({
  channelName,
  channelType,
  hasDecision,
  nudge,
  onSubmit,
  disabled = false,
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasDecision && inputRef.current) {
      inputRef.current.focus();
    }
  }, [hasDecision]);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="shrink-0 px-4 pb-4 sm:px-5">
      {(hasDecision || nudge) && (
        <div className="mb-2 flex flex-col gap-1.5">
          {hasDecision && (
            <div className="rounded-md border border-slack-link/12 bg-slack-link/5 px-3 py-1.5 text-[11px] font-medium text-slack-link">
              Decision pending in this channel. Send your response to lock in a choice.
            </div>
          )}
          {nudge && (
            <div className="rounded-md border border-slack-yellow/12 bg-slack-yellow/5 px-3 py-1.5 text-[11px] font-medium text-slack-yellow">
              {nudge}
            </div>
          )}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-slack-composer-border bg-slack-composer-bg shadow-[0_1px_0_rgba(255,255,255,0.75),0_1px_3px_rgba(0,0,0,0.08)] focus-within:border-[#8d8d91]">
        <div className="px-4 py-4 sm:px-5">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${channelType === 'channel' ? '#' : ''}${channelName}`}
            disabled={disabled}
            className="w-full bg-transparent text-[#1d1c1d] text-[15px] leading-6 placeholder:text-slack-composer-placeholder
              outline-none disabled:opacity-50"
          />
        </div>
        <div className="flex items-center justify-between border-t border-black/6 bg-slack-composer-footer px-3 py-2">
          <div className="flex items-center gap-0.5">
            <ToolbarIcon><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></ToolbarIcon>
            <ToolbarIcon><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></ToolbarIcon>
            <div className="w-px h-4 bg-slack-divider mx-1" />
            <ToolbarIcon><line x1="19" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="14" y1="20" x2="5" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="15" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></ToolbarIcon>
            <ToolbarIcon><polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/><polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></ToolbarIcon>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || disabled}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              text.trim() && !disabled
                ? 'bg-slack-green text-white hover:bg-slack-green/90 cursor-pointer'
                : 'bg-transparent text-slack-composer-icon/35 cursor-default'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolbarIcon({ children }: { children: React.ReactNode }) {
  return (
    <button className="cursor-default rounded-md p-1.5 text-slack-composer-icon/60 transition-colors hover:bg-black/3 hover:text-slack-composer-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        {children}
      </svg>
    </button>
  );
}
