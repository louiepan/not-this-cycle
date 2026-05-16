'use client';

import { useState } from 'react';
import { DifficultySelect } from './DifficultySelect';
import type { DifficultyConfig } from '@/engine/types';
import type { RunRecord } from '@/lib/playerProfile';
import { RatingEngine } from '@/engine/RatingEngine';

interface AcceptOfferScreenProps {
  onAccept: (difficulty: DifficultyConfig, playerName: string) => void;
  initialPlayerName?: string;
  pastRuns?: RunRecord[];
  onResetProfile?: () => void;
}

const BUCKET_SHORT_LABELS: Record<RunRecord['calibrationBucket'], string> = {
  needs_improvement: 'Needs Improvement',
  partially_meets: 'Partially Meets',
  meets_expectations: 'Meets Most',
  exceeds_expectations: 'Exceeds',
  strongly_exceeds: 'Strongly Exceeds',
};

function formatRunDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

type OnboardingStep = 1 | 2 | 3;

function StepShell({
  step,
  title,
  subtitle,
  contentWidth = 'wide',
  children,
}: {
  step: OnboardingStep;
  title: string;
  subtitle: string;
  contentWidth?: 'narrow' | 'wide';
  children: React.ReactNode;
}) {
  const isNarrow = contentWidth === 'narrow';

  return (
    <section className="screen-shell max-w-3xl">
      <div className="screen-header">
        <div className={isNarrow ? 'mx-auto max-w-xl' : undefined}>
          <div className={isNarrow ? 'eyebrow text-center' : 'eyebrow'}>TechCorp PM Onboarding</div>
          <div className={`mt-4 flex items-center gap-3 ${isNarrow ? 'justify-center' : ''}`}>
            {[1, 2, 3].map((item) => {
              const isActive = step === item;
              const isComplete = step > item;
              return (
                <div key={item} className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      isComplete
                        ? 'bg-slack-link text-[#0d0f11]'
                        : isActive
                          ? 'border border-slack-link/60 bg-slack-link/10 text-slack-white'
                          : 'border border-white/10 bg-[#111418] text-slack-text-secondary'
                    }`}
                  >
                    {item}
                  </span>
                  {item < 3 && <div className="h-px w-8 bg-white/10" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="screen-body">
        <div className={isNarrow ? 'content-measure-narrow mx-auto text-center' : 'content-measure'}>
          <h1 className="screen-title">{title}</h1>
          <p className={`screen-subtitle mt-4 ${isNarrow ? 'mx-auto' : ''}`}>{subtitle}</p>
        </div>

        <div className={isNarrow ? 'content-measure-narrow mx-auto mt-8' : 'mt-8'}>{children}</div>
      </div>
    </section>
  );
}

export function AcceptOfferScreen({
  onAccept,
  initialPlayerName = '',
  pastRuns = [],
  onResetProfile,
}: AcceptOfferScreenProps) {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyConfig | null>(null);
  const [playerName, setPlayerName] = useState(initialPlayerName);

  const trimmedPlayerName = playerName.trim();
  const canContinueFromName = trimmedPlayerName.length > 0;
  const canContinueFromLevel = selectedDifficulty !== null;
  const hasReturningName = initialPlayerName.trim().length > 0;
  const recentPastRuns = pastRuns.slice(0, 3);

  function handleResetIdentity() {
    setPlayerName('');
    onResetProfile?.();
  }

  return (
    <div className="app-stage">
      <div className="app-stage-center">
        {step === 1 && (
          <StepShell
            step={1}
            title="What’s your name?"
            subtitle="This becomes your Slack display name and follows you all the way into your performance review."
            contentWidth="narrow"
          >
            <div className="panel stack-lg px-6 py-6 md:px-7 md:py-7">
              <label className="field-row">
                <span className="sr-only">Your name</span>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="field-input"
                  maxLength={40}
                  autoFocus
                />
              </label>

              {hasReturningName && (
                <p className="text-center text-xs text-slack-text-secondary">
                  Welcome back. Not {initialPlayerName.trim()}?{' '}
                  <button
                    type="button"
                    onClick={handleResetIdentity}
                    className="text-slack-link underline-offset-2 hover:underline cursor-pointer"
                  >
                    Start fresh
                  </button>
                  .
                </p>
              )}

              <div className="actions-row">
                <p className="content-measure-narrow text-center text-sm leading-6 text-slack-text-secondary">
                  You are about to be evaluated by people who just met you.
                </p>
                <button
                  onClick={() => canContinueFromName && setStep(2)}
                  disabled={!canContinueFromName}
                  className="btn-primary"
                >
                  Continue
                </button>
              </div>
            </div>

            {recentPastRuns.length > 0 && (
              <div className="mt-6 panel panel-muted px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="section-label text-slack-text-secondary">
                    Previous Reviews on File
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-slack-text-secondary">
                    {pastRuns.length} total
                  </span>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {recentPastRuns.map((run) => {
                    const archetypeLabel =
                      RatingEngine.ARCHETYPE_LABELS[run.archetype]?.name ?? 'The Survivor';
                    return (
                      <li
                        key={run.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-[#15181d] px-3 py-2 text-slack-text"
                      >
                        <span className="font-mono text-xs tabular-nums text-slack-text-secondary">
                          {formatRunDate(run.completedAt)}
                        </span>
                        <span className="flex-1 truncate">
                          {archetypeLabel}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slack-text-secondary">
                          {BUCKET_SHORT_LABELS[run.calibrationBucket]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-[11px] leading-5 text-slack-text-secondary">
                  Stored on this device only. Your name and run history never leave your browser.
                </p>
              </div>
            )}
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            step={2}
            title="What level PM are you?"
            subtitle="This sets the amount of ambient chaos, timer pressure, and executive improvisation waiting for you on day one."
            contentWidth="narrow"
          >
            <div className="panel stack-lg px-6 py-6 md:px-7 md:py-7">
              <DifficultySelect
                onSelect={setSelectedDifficulty}
                selectedDifficultyId={selectedDifficulty?.id ?? null}
              />

              <div className="actions-row text-center">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => canContinueFromLevel && setStep(3)}
                  disabled={!canContinueFromLevel}
                  className="btn-primary"
                >
                  Continue
                </button>
              </div>
            </div>
          </StepShell>
        )}

        {step === 3 && selectedDifficulty && (
          <StepShell
            step={3}
            title="Do you accept the offer?"
            subtitle={`Final check before we drop ${trimmedPlayerName} into Q4 planning as a ${selectedDifficulty.label}.`}
          >
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="panel stack-md">
                <div className="section-label">Candidate Summary</div>
                <div className="stack-md">
                  <div className="panel panel-muted text-center">
                    <div className="section-label">Name</div>
                    <div className="mt-1 text-lg font-semibold text-slack-white">{trimmedPlayerName}</div>
                  </div>
                  <div className="panel panel-muted text-center">
                    <div className="section-label">Level</div>
                    <div className="mt-1 text-lg font-semibold text-slack-white">{selectedDifficulty.label}</div>
                  </div>
                  <div className="panel panel-muted text-center">
                    <div className="section-label">Team</div>
                    <div className="mt-1 text-lg font-semibold text-slack-white">Core Platform</div>
                  </div>
                </div>
              </div>

              <div className="panel panel-muted stack-lg">
                <div className="flex items-center justify-center gap-3 border-b border-white/8 pb-4 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] text-xl">
                    ✉️
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slack-text-secondary">
                      Offer Letter
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slack-white">
                      Your Offer — {selectedDifficulty.label}, Core Platform
                    </div>
                  </div>
                </div>

                <div className="content-measure mx-auto stack-md text-center text-[15px] leading-7 text-slack-text">
                  <p>Hi {trimmedPlayerName},</p>
                  <p>
                    We&apos;re thrilled to extend an offer for the role of{' '}
                    <span className="font-semibold text-slack-white">{selectedDifficulty.label}</span> on the
                    Core Platform team at TechCorp.
                  </p>
                  <p>
                    You&apos;ll be joining during an exciting time. Q4 planning is underway, dependencies have
                    multiplied, and the CEO has already referred to your area as a top priority in a meeting
                    nobody documented correctly.
                  </p>
                  <p>
                    Your first day is <span className="font-semibold text-slack-white">today</span>.
                  </p>
                  <p className="text-sm italic text-slack-text-secondary">
                    You will be evaluated at the end of the quarter, whether or not anyone agrees on what
                    success looked like.
                  </p>
                </div>

                <div className="actions-row text-center">
                  <button
                    onClick={() => setStep(2)}
                    className="btn-secondary cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => onAccept(selectedDifficulty, trimmedPlayerName)}
                    className="btn-success cursor-pointer"
                  >
                    Accept Offer
                  </button>
                </div>
              </div>
            </div>
          </StepShell>
        )}
      </div>
    </div>
  );
}
