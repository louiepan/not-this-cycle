'use client';

import { useState, useRef, useEffect } from 'react';

interface MessageComposerProps {
  channelName: string;
  hasDecision: boolean;
  nudge: string | null;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function MessageComposer({
  channelName,
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
    <div className="px-4 pb-4 shrink-0">
      {nudge && (
        <div className="mb-1.5 px-3 py-1.5 text-xs text-slack-yellow bg-slack-yellow/10 rounded border border-slack-yellow/20">
          {nudge}
        </div>
      )}
      <div className="border border-slack-composer-border rounded-lg bg-slack-composer-bg focus-within:border-slack-text-secondary transition-colors">
        {/* Input */}
        <div className="px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${channelName.startsWith('#') ? '' : '#'}${channelName}`}
            disabled={disabled}
            className="w-full bg-transparent text-slack-text text-[15px] placeholder:text-slack-text-secondary
              outline-none disabled:opacity-50"
          />
        </div>
        {/* Formatting toolbar */}
        <div className="flex items-center justify-between px-2 pb-1.5">
          <div className="flex items-center gap-0.5">
            <ToolbarIcon><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></ToolbarIcon>
            <ToolbarIcon><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></ToolbarIcon>
            <div className="w-px h-4 bg-slack-divider mx-1" />
            <ToolbarIcon><line x1="19" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="14" y1="20" x2="5" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="15" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></ToolbarIcon>
            <ToolbarIcon><polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/><polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></ToolbarIcon>
            <ToolbarIcon><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></ToolbarIcon>
            <ToolbarIcon><line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></ToolbarIcon>
            <ToolbarIcon><rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></ToolbarIcon>
          </div>
          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || disabled}
            className={`p-1.5 rounded transition-colors ${
              text.trim() && !disabled
                ? 'text-slack-green hover:text-slack-green/80 cursor-pointer'
                : 'text-slack-text-secondary/40 cursor-default'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolbarIcon({ children }: { children: React.ReactNode }) {
  return (
    <button className="p-1.5 text-slack-text-secondary/60 hover:text-slack-text-secondary cursor-default rounded transition-colors">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        {children}
      </svg>
    </button>
  );
}
