'use client';

import type { ChannelDef } from '@/engine/types';

interface ChannelHeaderProps {
  channel: ChannelDef;
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  const prefix = channel.type === 'dm' ? '' : '#';

  return (
    <div className="h-[52px] border-b border-slack-divider flex items-center px-4 shrink-0 bg-slack-channel-header justify-between">
      <div className="flex items-center gap-4 min-w-0">
        {/* Hamburger */}
        <button className="text-slack-text-secondary hover:text-slack-text shrink-0 cursor-default">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        <div className="min-w-0">
          <div className="font-bold text-slack-white text-[15px] leading-tight truncate">
            {prefix}{channel.name}
          </div>
          {channel.description && (
            <div className="text-xs text-slack-text-secondary leading-tight truncate">
              {channel.description}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slack-bg/50 border border-slack-divider rounded-md px-2.5 py-1 text-sm text-slack-text-secondary">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <span className="text-xs">Search</span>
        </div>
        {/* Decorative icons */}
        <button className="p-1.5 text-slack-text-secondary hover:text-slack-text cursor-default">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 5v3M8 10v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>
        <button className="p-1.5 text-slack-text-secondary hover:text-slack-text cursor-default">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>
        <button className="p-1.5 text-slack-text-secondary hover:text-slack-text cursor-default">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="3" cy="8" r="1" fill="currentColor"/><circle cx="13" cy="8" r="1" fill="currentColor"/></svg>
        </button>
      </div>
    </div>
  );
}
