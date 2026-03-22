'use client';

import { DIFFICULTIES, type DifficultyConfig } from '@/engine/types';

interface DifficultySelectProps {
  onSelect: (difficulty: DifficultyConfig) => void;
  selectedDifficultyId?: DifficultyConfig['id'] | null;
}

const DIFFICULTY_INFO = {
  junior: {
    description: 'Longer timers, less noise. Good for your first playthrough.',
  },
  senior: {
    description: 'Standard pressure. The real thing.',
  },
  principal: {
    description: 'Everything at once. You asked for this.',
  },
};

export function DifficultySelect({ onSelect, selectedDifficultyId = null }: DifficultySelectProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      {Object.values(DIFFICULTIES).map((diff) => {
        const info = DIFFICULTY_INFO[diff.id];
        const isSelected = selectedDifficultyId === diff.id;
        return (
          <button
            key={diff.id}
            onClick={() => onSelect(diff)}
            className={`w-full rounded-[1.125rem] border px-4 py-4 text-left transition-all cursor-pointer group ${
              isSelected
                ? 'border-slack-link/60 bg-slack-link/10 shadow-[0_0_0_1px_rgba(54,197,240,0.15)]'
                : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/14'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={`font-semibold text-base transition-colors ${
                  isSelected ? 'text-slack-white' : 'text-slack-white/90 group-hover:text-slack-white'
                }`}>
                  {diff.label}
                </div>
                <div className="mt-1 text-sm leading-relaxed text-slack-text-secondary">
                  {info.description}
                </div>
              </div>
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isSelected
                    ? 'border-slack-link bg-slack-link text-[#0d0f11]'
                    : 'border-white/15 text-transparent group-hover:border-white/25'
                }`}
                aria-hidden="true"
              >
                ●
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
