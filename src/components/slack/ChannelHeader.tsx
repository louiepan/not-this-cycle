'use client';

import type { ChannelDef } from '@/engine/types';

interface ChannelHeaderProps {
  channel: ChannelDef;
  memberCount?: number;
}

export function ChannelHeader({ channel, memberCount }: ChannelHeaderProps) {
  const prefix = channel.type === 'dm' ? '' : '#';
  const displayMemberCount = memberCount ?? (channel.type === 'dm' ? undefined : 47);

  return (
    <div className="flex shrink-0 items-center gap-4 border-b border-slack-divider bg-slack-channel-header px-5 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-normal leading-none text-slack-text-secondary">{prefix}</span>
          <h1 className="truncate text-[15px] font-semibold leading-none tracking-[-0.01em] text-slack-text">
            {channel.name}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-[12px] leading-tight text-slack-text-secondary">
          {displayMemberCount !== undefined && (
            <>
              <span className="text-slack-text-muted hover:text-slack-text cursor-pointer">
                {displayMemberCount} members
              </span>
              {channel.description && (
                <span className="text-slack-muted-chrome">·</span>
              )}
            </>
          )}
          {channel.description && (
            <span className="truncate">{channel.description}</span>
          )}
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex shrink-0 items-center gap-1">
        <HeaderIconBtn label="Members">
          <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </HeaderIconBtn>
        <HeaderIconBtn label="Search">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </HeaderIconBtn>
        <HeaderIconBtn label="More">
          <circle cx="3" cy="8" r="1.2" fill="currentColor" />
          <circle cx="8" cy="8" r="1.2" fill="currentColor" />
          <circle cx="13" cy="8" r="1.2" fill="currentColor" />
        </HeaderIconBtn>
      </div>
    </div>
  );
}

function HeaderIconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex h-7 w-7 cursor-default items-center justify-center rounded text-slack-muted-chrome hover:bg-slack-sidebar-hover hover:text-slack-text"
      aria-label={label}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        {children}
      </svg>
    </button>
  );
}
