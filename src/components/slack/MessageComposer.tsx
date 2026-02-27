'use client';

import type { Choice } from '@/engine/types';

interface MessageComposerProps {
  channelName: string;
  choices: Choice[] | null;
  onChoiceSelect: (choice: Choice) => void;
  disabled?: boolean;
}

export function MessageComposer({
  channelName,
  choices,
  onChoiceSelect,
  disabled = false,
}: MessageComposerProps) {
  const hasChoices = choices && choices.length > 0;

  return (
    <div className="px-5 pb-4 shrink-0">
      <div
        className={`border rounded-lg bg-slack-composer-bg ${
          hasChoices ? 'border-slack-choice-border' : 'border-slack-composer-border'
        }`}
      >
        {hasChoices ? (
          <div className="p-2">
            <div className="flex flex-wrap gap-2">
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => onChoiceSelect(choice)}
                  disabled={disabled}
                  className="px-3 py-2 text-sm rounded-md bg-slack-choice-bg text-slack-link 
                    hover:bg-slack-choice-hover border border-slack-choice-border/30
                    transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                    text-left"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-3 py-2.5 text-slack-text-secondary text-[15px] select-none">
            Message {channelName}
          </div>
        )}
      </div>
    </div>
  );
}
