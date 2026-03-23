'use client';

import type { DifficultyConfig } from '@/engine/types';

interface MorningBriefProps {
  difficulty: DifficultyConfig;
  playerName: string;
  onContinue: () => void;
  onBack: () => void;
}

export function MorningBrief({
  difficulty,
  playerName,
  onContinue,
  onBack,
}: MorningBriefProps) {
  return (
    <div className="app-stage">
      <div className="app-stage-center">
        <section className="screen-shell max-w-4xl">
          <div className="screen-header">
            <div className="eyebrow">TechCorp PM Onboarding</div>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slack-link text-xs font-bold text-[#0d0f11]">
                4
              </span>
              <div className="h-px w-10 bg-white/10" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slack-text-secondary">
                Morning Brief
              </span>
            </div>
          </div>

          <div className="screen-body">
            <div className="content-measure">
              <h1 className="screen-title">Before We Throw You Into Slack</h1>
              <p className="screen-subtitle mt-4">
                {playerName}, this extra brief is only here because you picked{' '}
                <span className="font-semibold text-slack-white">{difficulty.label}</span>.
                At higher levels, people expect you to reverse-engineer the situation from incomplete messages.
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="panel stack-md">
                <div className="section-label">What Is Happening</div>
                <div className="content-measure text-[15px] leading-7 text-slack-text">
                  Q4 planning is already in motion. Leadership wants a polished story for the next all-hands,
                  engineering thinks the foundation is brittle, design thinks the scope is incoherent, and
                  everyone assumes you will turn that into a plan before end of day.
                </div>

                <div className="section-label pt-2">What Success Actually Looks Like</div>
                <div className="content-measure text-[15px] leading-7 text-slack-text">
                  There is no clean win condition. Your job is to keep the story credible, make decisions fast
                  enough that people do not route around you, and avoid sounding so certain that the whole thing
                  collapses under its own optimism.
                </div>

                <div className="section-label pt-2">Who Matters First</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-white/8 bg-[#111418] px-4 py-3">
                    <div className="text-sm font-semibold text-slack-white">Your VP</div>
                    <div className="mt-1 text-sm leading-6 text-slack-text-secondary">
                      Wants a crisp answer quickly and has low patience for ambiguity.
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-[#111418] px-4 py-3">
                    <div className="text-sm font-semibold text-slack-white">Engineering</div>
                    <div className="mt-1 text-sm leading-6 text-slack-text-secondary">
                      Has real implementation risk and will resent being volunteered into fantasy timelines.
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-[#111418] px-4 py-3">
                    <div className="text-sm font-semibold text-slack-white">Design</div>
                    <div className="mt-1 text-sm leading-6 text-slack-text-secondary">
                      Cares about cohesion and will notice when you are optimizing for presentation over product quality.
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-[#111418] px-4 py-3">
                    <div className="text-sm font-semibold text-slack-white">Your Manager</div>
                    <div className="mt-1 text-sm leading-6 text-slack-text-secondary">
                      Supportive in tone, selective in substance. Helpful if you make their defense easy.
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel panel-muted stack-md">
                <div className="section-label">Operating Advice</div>
                <div className="stack-sm text-sm leading-6 text-slack-text">
                  <p>Answer direct asks quickly, even if the answer is uncomfortable.</p>
                  <p>Use DMs to gather context, but pull decisions into the right shared channel when needed.</p>
                  <p>If you tag someone, make it clear why. The game now notices accountability language.</p>
                  <p>People will remember your confidence even when they forget your reasoning.</p>
                </div>

                <div className="rounded-2xl border border-slack-link/20 bg-slack-link/8 px-4 py-4 text-sm leading-6 text-slack-text-secondary">
                  You can click on people once you are in Slack to view their title. Nobody is going to volunteer the org chart for you.
                </div>

                <div className="actions-row text-center">
                  <button onClick={onBack} className="btn-secondary cursor-pointer">
                    Back
                  </button>
                  <button onClick={onContinue} className="btn-success cursor-pointer">
                    Enter Slack
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
