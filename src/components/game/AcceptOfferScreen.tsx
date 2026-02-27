'use client';

import { useState } from 'react';
import { DifficultySelect } from './DifficultySelect';
import type { DifficultyConfig } from '@/engine/types';

interface AcceptOfferScreenProps {
  onAccept: (difficulty: DifficultyConfig) => void;
}

export function AcceptOfferScreen({ onAccept }: AcceptOfferScreenProps) {
  const [showDifficulty, setShowDifficulty] = useState(false);

  return (
    <div className="h-screen w-screen bg-slack-bg flex items-center justify-center">
      <div className="max-w-lg w-full mx-4">
        {!showDifficulty ? (
          <div className="text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">📧</div>
              <h1 className="text-2xl font-bold text-slack-white mb-2">
                You have a new offer!
              </h1>
              <div className="bg-slack-channel-bg rounded-lg p-6 border border-slack-divider text-left mt-6">
                <div className="text-slack-text-secondary text-sm mb-2">
                  From: Talent Acquisition &lt;noreply@techcorp.com&gt;
                </div>
                <div className="text-slack-text-secondary text-sm mb-4">
                  Subject: <span className="text-slack-white">Your Offer — Product Manager, Core Platform</span>
                </div>
                <div className="text-slack-text space-y-3">
                  <p>
                    Hi,
                  </p>
                  <p>
                    We&apos;re thrilled to extend an offer for the role of <span className="text-slack-white font-semibold">Product Manager</span> on
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
            </div>
            <button
              onClick={() => setShowDifficulty(true)}
              className="px-8 py-3 bg-slack-green text-white font-bold rounded-lg
                hover:bg-slack-green/90 transition-colors cursor-pointer text-lg"
            >
              Accept Offer
            </button>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-bold text-slack-white mb-2">
              Choose your level
            </h2>
            <p className="text-slack-text-secondary mb-6">
              This determines how much pressure you&apos;ll face.
            </p>
            <div className="flex justify-center">
              <DifficultySelect onSelect={onAccept} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
