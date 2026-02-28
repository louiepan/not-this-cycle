'use client';

import { useState } from 'react';
import { DifficultySelect } from './DifficultySelect';
import type { DifficultyConfig } from '@/engine/types';

interface AcceptOfferScreenProps {
  onAccept: (difficulty: DifficultyConfig) => void;
}

export function AcceptOfferScreen({ onAccept }: AcceptOfferScreenProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyConfig | null>(null);

  return (
    <div className="h-screen w-screen bg-slack-bg flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {!selectedDifficulty ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slack-white mb-2">
              Choose your level
            </h2>
            <p className="text-slack-text-secondary mb-8">
              This determines how much pressure you&apos;ll face.
            </p>
            <div className="flex justify-center">
              <DifficultySelect onSelect={setSelectedDifficulty} />
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-slack-channel-bg rounded-xl p-6 border border-slack-divider">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">✉️</span>
                <h1 className="text-xl font-bold text-slack-white">
                  You have a new offer!
                </h1>
              </div>
              <div className="text-slack-text-secondary text-sm mb-1">
                From: Talent Acquisition &lt;noreply@techcorp.com&gt;
              </div>
              <div className="text-slack-text-secondary text-sm mb-5">
                Subject: <span className="text-slack-white">Your Offer — {selectedDifficulty.label}, Core Platform</span>
              </div>
              <div className="border-t border-slack-divider pt-5 text-slack-text space-y-3 text-[15px]">
                <p>Hi,</p>
                <p>
                  We&apos;re thrilled to extend an offer for the role of{' '}
                  <span className="text-slack-white font-semibold">{selectedDifficulty.label}</span> on
                  the Core Platform team at TechCorp.
                </p>
                <p>
                  You&apos;ll be joining during an exciting time — Q4 planning is
                  underway and the CEO has personally flagged your team&apos;s
                  initiative as a top priority.
                </p>
                <p>
                  Your first day is <span className="text-slack-white font-semibold">today</span>.
                </p>
                <p className="text-slack-text-secondary text-xs italic">
                  (You will be evaluated at the end of the quarter.)
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedDifficulty(null)}
                className="px-5 py-3 text-slack-text-secondary hover:text-slack-white
                  transition-colors cursor-pointer text-sm"
              >
                ← Back
              </button>
              <button
                onClick={() => onAccept(selectedDifficulty)}
                className="flex-1 py-3 bg-slack-green text-white font-bold rounded-lg
                  hover:bg-slack-green/90 transition-colors cursor-pointer text-lg"
              >
                Accept Offer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
