'use client';

import type { DifficultyConfig, ScenarioWorld } from '@/engine/types';

interface MorningBriefProps {
  difficulty: DifficultyConfig;
  playerName: string;
  world: ScenarioWorld;
  onContinue: () => void;
  onBack: () => void;
}

export function MorningBrief({
  difficulty,
  playerName,
  world,
  onContinue,
  onBack,
}: MorningBriefProps) {
  void world; // companyName available if we want to surface it in copy later
  return (
    <div
      className="flex h-full w-full flex-col bg-slack-bg text-slack-text antialiased"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {/* Crumb header */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-slack-divider px-6 py-3">
        <button
          onClick={onBack}
          aria-label="Back"
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-slack-text-secondary hover:bg-slack-sidebar-hover hover:text-slack-text"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex items-center gap-2 text-[12.5px] text-slack-text-secondary">
          <span>Onboarding</span>
          <span className="text-slack-text-secondary/60">/</span>
          <span className="font-semibold text-slack-text">Morning brief — Junior PM</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-8 pb-16 pt-9">
          <span className="mb-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slack-link">
            <span className="h-[5px] w-[5px] rotate-45 bg-slack-link" />
            Final brief
          </span>
          <h1 className="text-[28px] font-bold leading-[1.2] tracking-[-0.022em] text-slack-text">
            Before we drop you into Slack
          </h1>
          <p className="mt-3 max-w-[58ch] text-[14.5px] leading-[1.65] text-slack-text-muted">
            {playerName}, this extra context is here because you chose{' '}
            <span className="font-semibold text-slack-text">{difficulty.label}</span>.
            Once you enter the workspace, assume the day is already in progress.
            Read fast, answer cleanly, and remember that public channels are partly
            for solving things and partly for being seen solving them.
          </p>

          {/* Card: What's happening */}
          <div className="mt-7 overflow-hidden rounded-xl border border-slack-divider bg-slack-sidebar">
            <div className="flex items-baseline gap-3 border-b border-slack-divider px-5 pb-3 pt-4">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-slack-text-secondary">
                Context
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-slack-text">
                What is happening
              </span>
            </div>
            <div className="space-y-4 px-5 py-5 text-[14px] leading-[1.7] text-slack-text">
              <p>
                Q4 planning is already underway. Leadership wants a clean story for
                the all-hands, engineering thinks the foundation is shaky, design
                thinks the scope is collapsing into sludge, and everyone assumes
                you will turn that into a credible plan by end of day.
              </p>
              <p className="text-slack-text-muted">
                There is no clean win condition. Your job is to keep the story
                credible, answer quickly enough that people do not route around
                you, and sound decisive without promising a version of reality
                the team cannot survive.
              </p>
            </div>
          </div>

          {/* Card: Who matters first */}
          <div className="mt-5 overflow-hidden rounded-xl border border-slack-divider bg-slack-sidebar">
            <div className="flex items-baseline gap-3 border-b border-slack-divider px-5 pb-3 pt-4">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-slack-text-secondary">
                People
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-slack-text">
                Who matters first
              </span>
            </div>
            <div className="grid grid-cols-1 gap-px bg-slack-divider md:grid-cols-2">
              <PersonBlock title="Your VP" body="Wants a crisp answer quickly and has low patience for ambiguity." />
              <PersonBlock title="Engineering" body="Has real implementation risk and will resent being volunteered into fantasy timelines." />
              <PersonBlock title="Design" body="Cares about cohesion and will notice when you are optimizing for presentation over product quality." />
              <PersonBlock title="Your Manager" body="Supportive in tone, selective in substance. Helpful if you make their defense easy." />
            </div>
          </div>

          {/* Card: How Slack signals trouble */}
          <div className="mt-5 overflow-hidden rounded-xl border border-slack-divider bg-slack-sidebar">
            <div className="flex items-baseline gap-3 border-b border-slack-divider px-5 pb-3 pt-4">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-slack-text-secondary">
                Mechanics
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-slack-text">
                How Slack signals trouble
              </span>
            </div>
            <div className="space-y-2.5 px-5 py-5 text-[13.5px] leading-[1.65] text-slack-text">
              <p><span className="font-semibold text-slack-text">@mentions</span> usually mean someone wants an answer, not a thought process.</p>
              <p><span className="font-semibold text-slack-text">Unread dots</span> are often noise until one of them quietly becomes your problem.</p>
              <p><span className="font-semibold text-slack-text">DMs</span> are where people admit what they do not want attached to a public channel.</p>
              <p><span className="font-semibold text-slack-text">Profiles</span> help with titles and vibes, not motives.</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-7 flex items-center gap-3.5 rounded-xl border border-slack-divider bg-slack-sidebar p-4">
            <div className="flex-1 text-[13px] leading-[1.55] text-slack-text-muted">
              If a message looks like a real ask, assume your next reply may
              become the version of the plan people repeat.
            </div>
            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer rounded-md border border-slack-composer-border bg-slack-bg px-3.5 py-2 text-[13px] font-medium text-slack-text-muted hover:bg-slack-sidebar-hover hover:text-slack-text"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md border-0 bg-slack-link px-4 py-2 text-[13.5px] font-bold tracking-tight text-[#1a0e07] transition-opacity hover:opacity-90"
            >
              Enter Slack
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-slack-sidebar p-4">
      <div className="text-[13.5px] font-semibold text-slack-text">{title}</div>
      <div className="mt-1 text-[12.5px] leading-[1.55] text-slack-text-muted">{body}</div>
    </div>
  );
}
