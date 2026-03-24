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
    <aside className="absolute inset-y-0 right-0 z-20 flex w-[min(88vw,340px)] flex-col border-l border-white/8 bg-[#17181d] shadow-[-24px_0_60px_rgba(0,0,0,0.36)]">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slack-text-secondary">
            Profile
          </div>
          <div className="mt-1 text-sm font-semibold text-slack-white">People details</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm text-slack-text-secondary transition-colors hover:bg-white/6 hover:text-slack-white"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="rounded-[1.25rem] border border-white/8 bg-[#1e2026] p-5">
          <div className="flex items-start gap-4 rounded-[1.125rem] border border-white/10 bg-[radial-gradient(circle_at_top,#2b3039_0%,#181b21_70%)] p-4">
            <div className="relative shrink-0">
              <Avatar name={stakeholder.name} size="lg" />
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#181b21] bg-[#0f1116] text-sm">
                {stakeholder.statusEmoji}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-slack-white">{stakeholder.name}</div>
              <div className="mt-1 text-sm leading-6 text-slack-text">{stakeholder.role}</div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slack-text-secondary">
                <span>{stakeholder.statusEmoji}</span>
                <span>{stakeholder.statusText}</span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slack-text-secondary">
              Slack Read
            </div>
            <div className="mt-2 rounded-xl border border-white/8 bg-[#15181d] px-4 py-3 text-sm leading-6 text-slack-text">
              {stakeholder.personality.communicationStyle}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slack-text-secondary">
              What Usually Lands
            </div>
            <div className="mt-2 rounded-xl border border-white/8 bg-[#15181d] px-4 py-3 text-sm leading-6 text-slack-text">
              Replies tend to track whatever room this person is already managing: the work, the optics, or both.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
