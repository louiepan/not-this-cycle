'use client';

import { DIFFICULTIES, type DifficultyConfig } from '@/engine/types';

interface DifficultySelectProps {
  onSelect: (difficulty: DifficultyConfig) => void;
}

const DIFFICULTY_INFO = {
  junior: {
    subtitle: 'Longer timers, less noise',
    description: 'Good for your first playthrough.',
  },
  senior: {
    subtitle: 'Standard pressure',
    description: 'The real thing.',
  },
  principal: {
    subtitle: 'Everything at once',
    description: 'You asked for this.',
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
            className="text-left px-5 py-4 rounded-lg border border-slack-divider
              bg-slack-channel-bg hover:bg-slack-message-hover
              transition-colors cursor-pointer group"
          >
            <div className="text-slack-white font-bold text-lg group-hover:text-slack-link transition-colors">
              {diff.label}
            </div>
            <div className="text-slack-text-secondary text-sm">{info.subtitle}</div>
            <div className="text-slack-text-muted text-xs mt-1">{info.description}</div>
          </button>
        );
      })}
    </div>
  );
}
