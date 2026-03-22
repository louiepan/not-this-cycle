'use client';

import type { ChannelDef } from '@/engine/types';

interface ChannelHeaderProps {
  channel: ChannelDef;
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  const prefix = channel.type === 'dm' ? '' : '#';

  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-slack-divider bg-slack-channel-header px-4 md:h-[50px]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden items-center rounded-md border border-white/7 bg-white/4 px-1.5 py-1 text-slack-muted-chrome md:flex">
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold leading-tight text-slack-white">
            {prefix}{channel.name}
          </div>
          {channel.description && (
            <div className="truncate text-xs leading-tight text-slack-text-secondary">
              {channel.description}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* Search */}
        <div className="hidden items-center gap-1.5 rounded-md border border-white/7 bg-white/4 px-2.5 py-1 text-sm text-slack-text-secondary lg:flex">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <span className="text-xs">Search</span>
        </div>
        {/* Decorative icons */}
        <button className="rounded-md p-1.5 text-slack-muted-chrome hover:bg-white/4 hover:text-slack-text cursor-default">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 5v3M8 10v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>
        <button className="rounded-md p-1.5 text-slack-muted-chrome hover:bg-white/4 hover:text-slack-text cursor-default">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>
        <button className="rounded-md p-1.5 text-slack-muted-chrome hover:bg-white/4 hover:text-slack-text cursor-default">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="3" cy="8" r="1" fill="currentColor"/><circle cx="13" cy="8" r="1" fill="currentColor"/></svg>
        </button>
      </div>
    </div>
  );
}
