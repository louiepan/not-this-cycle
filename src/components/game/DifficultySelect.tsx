'use client';

import { DIFFICULTIES, type DifficultyConfig } from '@/engine/types';

interface DifficultySelectProps {
  onSelect: (difficulty: DifficultyConfig) => void;
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

export function DifficultySelect({ onSelect }: DifficultySelectProps) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      {Object.values(DIFFICULTIES).map((diff) => {
        const info = DIFFICULTY_INFO[diff.id];
        return (
          <button
            key={diff.id}
            onClick={() => onSelect(diff)}
            className="text-center px-6 py-5 rounded-xl border border-slack-divider
              bg-slack-channel-bg hover:bg-slack-message-hover hover:border-slack-text-secondary
              transition-all cursor-pointer group"
          >
            <div className="text-slack-white font-bold text-lg group-hover:text-slack-link transition-colors">
              {diff.label}
            </div>
            <div className="text-slack-text-secondary text-sm mt-1">{info.description}</div>
          </button>
        );
      })}
    </div>
  );
}
