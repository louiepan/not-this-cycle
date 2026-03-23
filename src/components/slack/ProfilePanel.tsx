'use client';

import type { Stakeholder } from '@/engine/types';

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
          <div className="flex h-40 items-center justify-center rounded-[1.125rem] border border-dashed border-white/12 bg-[radial-gradient(circle_at_top,#2b3039_0%,#181b21_70%)] text-sm font-semibold uppercase tracking-[0.16em] text-slack-text-secondary">
            Placeholder Photo
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slack-text-secondary">
              Name
            </div>
            <div className="mt-2 text-xl font-bold text-slack-white">{stakeholder.name}</div>
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slack-text-secondary">
              Title
            </div>
            <div className="mt-2 text-sm leading-6 text-slack-text">{stakeholder.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
