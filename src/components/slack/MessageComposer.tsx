'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Stakeholder } from '@/engine/types';

interface MessageComposerProps {
  channelName: string;
  channelType: 'channel' | 'dm';
  stakeholders: Stakeholder[];
  hasDecision: boolean;
  decisionCount?: number;
  decisionTargetName?: string | null;
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
  decisionCount = 0,
  decisionTargetName = null,
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

  const decisionSummary = hasDecision
    ? decisionCount > 1
      ? 'There are multiple asks hanging in this channel. Your next message resolves the active one.'
      : decisionTargetName
        ? `${decisionTargetName} is waiting on your call here. Your next message becomes the answer.`
        : 'A decision is waiting in this channel. Your next message becomes the answer.'
    : null;

  const placeholder = hasDecision
    ? `Reply with your call in ${channelType === 'channel' ? '#' : ''}${channelName}`
    : `Message ${channelType === 'channel' ? '#' : ''}${channelName}`;

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
    setHighlightedIndex(0);
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

  function applyFormat(marker: string) {
    const input = inputRef.current;
    if (!input || disabled) return;
    const start = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? text.length;
    const selected = text.slice(start, end);
    const nextText =
      `${text.slice(0, start)}${marker}${selected}${marker}${text.slice(end)}`;
    const cursorStart = selected ? start + marker.length : start + marker.length;
    const cursorEnd = selected ? end + marker.length : start + marker.length;

    setText(nextText);
    setMentionState(null);

    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(cursorStart, cursorEnd);
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

    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.shiftKey && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      applyFormat('*');
      return;
    }
    if (mod && !e.shiftKey && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      applyFormat('_');
      return;
    }
    if (mod && e.shiftKey && (e.key === 'x' || e.key === 'X')) {
      e.preventDefault();
      applyFormat('~');
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Suppress unused-var warnings while we lean on dialogue context for decisions.
  void decisionSummary;

  // Suppress unused warning while we lean on dialogue context for decisions.
  void decisionSummary;

  return (
    <div className="relative shrink-0 px-5 pb-4 pt-3">
      {nudge && (
        <div className="mb-2 rounded-md border border-slack-yellow/20 bg-slack-yellow/5 px-3 py-1.5 text-[11px] font-medium text-slack-yellow">
          {nudge}
        </div>
      )}
      <div
        className={`overflow-hidden rounded-lg border bg-slack-composer-bg transition-colors focus-within:border-slack-text-secondary/60 ${
          hasDecision ? 'border-slack-link/40' : 'border-slack-composer-border'
        }`}
      >
        {/* Top toolbar — formatting controls. */}
        <div className="flex items-center gap-0.5 border-b border-slack-divider px-2 py-1.5">
          <ToolbarText
            onMouseDown={(e) => { e.preventDefault(); applyFormat('*'); }}
            label="Bold"
          >
            <b>B</b>
          </ToolbarText>
          <ToolbarText
            onMouseDown={(e) => { e.preventDefault(); applyFormat('_'); }}
            label="Italic"
          >
            <i>I</i>
          </ToolbarText>
          <ToolbarText
            onMouseDown={(e) => { e.preventDefault(); applyFormat('~'); }}
            label="Strikethrough"
          >
            <span className="line-through">S</span>
          </ToolbarText>
          <div className="mx-1.5 h-4 w-px bg-slack-divider" />
          <ToolbarIcon><path d="M5 6.5h10M5 9.5h10M5 12.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></ToolbarIcon>
          <ToolbarIcon><path d="M3 6.5h2M3 9.5h2M3 12.5h2M7 6.5h8M7 9.5h8M7 12.5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></ToolbarIcon>
          <div className="mx-1.5 h-4 w-px bg-slack-divider" />
          <ToolbarIcon><path d="M9 11l-3-3 3-3M3 8h6M11 5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/></ToolbarIcon>
        </div>

        {/* Input area */}
        <div className="px-4 py-3.5">
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
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent text-[14px] leading-6 text-slack-text outline-none placeholder:text-slack-composer-placeholder disabled:opacity-50"
          />
          {mentionState && mentionSuggestions.length > 0 && (
            <div className="absolute bottom-full left-5 right-5 z-10 mb-2 overflow-hidden rounded-lg border border-slack-composer-border bg-slack-composer-bg shadow-[0_14px_32px_rgba(0,0,0,0.4)]">
              <div className="border-b border-slack-divider px-3 py-2 text-[10.5px] font-bold uppercase tracking-[0.06em] text-slack-text-secondary">
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
                      highlightedIndex === index ? 'bg-slack-sidebar-hover' : 'hover:bg-slack-sidebar-hover/60'
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-slack-sidebar-active to-slack-sidebar text-[11px] font-bold uppercase text-slack-text">
                      {stakeholder.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-slack-text">{stakeholder.name}</div>
                      <div className="truncate text-[11.5px] text-slack-text-secondary">{stakeholder.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom toolbar + send */}
        <div className="flex items-center justify-between border-t border-slack-divider bg-slack-composer-footer px-2 py-1.5">
          <div className="flex items-center gap-0.5">
            <ToolbarIcon><path d="M5 12h10M10 7v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></ToolbarIcon>
            <ToolbarIcon><circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M7 11s1 1.5 3 1.5 3-1.5 3-1.5M8 8h.5M11.5 8h.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></ToolbarIcon>
            <ToolbarIcon><path d="M11 6l-5 5 4 4 5-5-4-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/></ToolbarIcon>
            <ToolbarIcon><rect x="4" y="5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M4 11l3-2 2 1 3-3 4 3" stroke="currentColor" strokeWidth="1.4" fill="none"/></ToolbarIcon>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || disabled}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              text.trim() && !disabled
                ? 'bg-slack-link text-[#1a0e07] hover:opacity-90 cursor-pointer'
                : 'bg-transparent text-slack-text-secondary cursor-default'
            }`}
            aria-label={hasDecision ? 'Reply' : 'Send'}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7l9-4-3.5 9-2-3.5-3.5-1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolbarIcon({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-6 w-6 cursor-default items-center justify-center rounded text-slack-composer-icon hover:bg-slack-sidebar-hover hover:text-slack-text"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        {children}
      </svg>
    </button>
  );
}

function ToolbarText({
  children,
  onMouseDown,
  label,
}: {
  children: React.ReactNode;
  onMouseDown?: (e: React.MouseEvent) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      aria-label={label}
      title={label}
      className={`flex h-6 w-6 items-center justify-center rounded font-serif text-[13px] text-slack-composer-icon hover:bg-slack-sidebar-hover hover:text-slack-text ${
        onMouseDown ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      {children}
    </button>
  );
}
