'use client';

import type { ChannelDef } from '@/engine/types';

interface ChannelHeaderProps {
  channel: ChannelDef;
  memberCount?: number;
}

export function ChannelHeader({ channel, memberCount }: ChannelHeaderProps) {
  return (
    <div className="h-12 border-b border-slack-divider flex items-center px-4 shrink-0 bg-slack-channel-header">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg font-bold text-slack-white truncate">
          {channel.type === 'dm' ? '' : '# '}
          {channel.name}
        </span>
        {memberCount !== undefined && (
          <span className="text-xs text-slack-text-secondary shrink-0">
            {memberCount} members
          </span>
        )}
      </div>
      {channel.description && (
        <span className="ml-3 text-sm text-slack-text-secondary truncate hidden sm:block">
          {channel.description}
        </span>
      )}
    </div>
  );
}
