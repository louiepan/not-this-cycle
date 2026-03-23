'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Stakeholder } from '@/engine/types';

interface MessageComposerProps {
  channelName: string;
  channelType: 'channel' | 'dm';
  stakeholders: Stakeholder[];
  hasDecision: boolean;
  nudge: string | null;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

interface MentionState {
  start: number;
  end: number;
  query: string;
}

function normalizeMentionValue(value: string): string {
  return value.toLowerCase().replace(/[\s-]+/g, '');
}

export function MessageComposer({
  channelName,
  channelType,
  stakeholders,
  hasDecision,
  nudge,
  onSubmit,
  disabled = false,
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasDecision && inputRef.current) {
      inputRef.current.focus();
    }
  }, [hasDecision]);

  const mentionSuggestions = useMemo(() => {
    if (!mentionState) return [];
    const query = normalizeMentionValue(mentionState.query);

    return stakeholders.filter((stakeholder) => {
      if (!query) return true;
      const full = normalizeMentionValue(stakeholder.name);
      const first = normalizeMentionValue(stakeholder.name.split(' ')[0]);
      return full.includes(query) || first.includes(query);
    });
  }, [mentionState, stakeholders]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [mentionState?.query]);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText('');
    setMentionState(null);
    setHighlightedIndex(0);
  }

  function updateMentionState(nextText: string, cursor: number) {
    const prefix = nextText.slice(0, cursor);
    const match = prefix.match(/(?:^|\s)@([a-zA-Z][a-zA-Z\s-]*)$/);
    if (!match) {
      setMentionState(null);
      return;
    }

    const start = prefix.lastIndexOf('@');
    setMentionState({
      start,
      end: cursor,
      query: match[1],
    });
  }

  function insertMention(stakeholder: Stakeholder) {
    if (!inputRef.current || !mentionState) return;

    const mentionText = `@${stakeholder.name} `;
    const nextText =
      `${text.slice(0, mentionState.start)}${mentionText}${text.slice(mentionState.end)}`;
    const nextCursor = mentionState.start + mentionText.length;

    setText(nextText);
    setMentionState(null);
    setHighlightedIndex(0);

    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (mentionSuggestions.length > 0 && mentionState) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % mentionSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionSuggestions[highlightedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionState(null);
        return;
      }
    }

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
            onChange={(e) => {
              const nextText = e.target.value;
              setText(nextText);
              updateMentionState(nextText, e.target.selectionStart ?? nextText.length);
            }}
            onClick={(e) => updateMentionState(text, e.currentTarget.selectionStart ?? text.length)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${channelType === 'channel' ? '#' : ''}${channelName}`}
            disabled={disabled}
            className="w-full bg-transparent text-[#1d1c1d] text-[15px] leading-6 placeholder:text-slack-composer-placeholder
              outline-none disabled:opacity-50"
          />
          {mentionState && mentionSuggestions.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_14px_32px_rgba(0,0,0,0.14)]">
              <div className="border-b border-black/6 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slack-composer-icon/70">
                Mention someone
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {mentionSuggestions.map((stakeholder, index) => (
                  <button
                    key={stakeholder.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(stakeholder);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                      highlightedIndex === index ? 'bg-[#f3f3f5]' : 'hover:bg-[#f7f7f8]'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/8 bg-[linear-gradient(180deg,#f4f4f7_0%,#e7e7eb_100%)] text-xs font-bold uppercase text-[#616061]">
                      IMG
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#1d1c1d]">
                        {stakeholder.name}
                      </div>
                      <div className="truncate text-xs text-slack-composer-icon/75">
                        {stakeholder.role}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
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
