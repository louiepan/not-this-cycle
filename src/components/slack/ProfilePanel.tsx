'use client';

import type { Stakeholder } from '@/engine/types';
import { Avatar } from './Avatar';

interface ProfilePanelProps {
  stakeholder: Stakeholder | null;
  onClose: () => void;
}

export function ProfilePanel({ stakeholder, onClose }: ProfilePanelProps) {
  if (!stakeholder) return null;

  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-[min(88vw,304px)] flex-col border-l border-slack-divider bg-slack-sidebar shadow-[-24px_0_60px_rgba(0,0,0,0.36)]">
      <div className="flex items-center justify-between border-b border-slack-divider px-4 py-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slack-text-secondary">
          Profile
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          className="flex h-6 w-6 items-center justify-center rounded text-slack-text-secondary transition-colors hover:bg-slack-sidebar-hover hover:text-slack-text"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="border-b border-slack-divider p-4">
          <div className="flex items-start gap-3">
            <Avatar name={stakeholder.name} id={stakeholder.id} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-semibold leading-tight tracking-[-0.01em] text-slack-text">
                {stakeholder.name}
              </div>
              <div className="mt-1.5 text-[12px] text-slack-text-secondary">{stakeholder.role}</div>
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11.5px] text-slack-text-secondary">
                <span className="h-[7px] w-[7px] rounded-full bg-slack-presence-green" />
                <span>{stakeholder.statusText || 'Active now'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="p-4">
          <div className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slack-text-secondary">
            Recent activity
          </div>
          <div className="flex gap-2.5 py-1.5 text-[12.5px] text-slack-text leading-[1.45]">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slack-link" />
            <div>
              <div>Posted in current channel</div>
              <div className="mt-0.5 text-[10.5px] text-slack-text-secondary">moments ago</div>
            </div>
          </div>
          <div className="flex gap-2.5 border-t border-slack-divider py-2.5 mt-1 text-[12.5px] text-slack-text leading-[1.45]">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slack-text-secondary" />
            <div>
              <div>{stakeholder.statusEmoji ? `${stakeholder.statusEmoji} ` : ''}{stakeholder.statusText || 'Online'}</div>
              <div className="mt-0.5 text-[10.5px] text-slack-text-secondary">current status</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
