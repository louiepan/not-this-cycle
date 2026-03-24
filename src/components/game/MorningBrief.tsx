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
                Once you enter, assume the day is already in progress. Read fast, answer cleanly, and remember
                that public channels are partly for solving things and partly for being seen solving them.
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="panel stack-md">
                <div className="section-label">What Is Happening</div>
                <div className="content-measure text-[15px] leading-7 text-slack-text">
                  Q4 planning is already underway. Leadership wants a clean story for the all-hands, engineering
                  thinks the foundation is shaky, design thinks the scope is collapsing into sludge, and everyone
                  assumes you will turn that into a credible plan by end of day.
                </div>

                <div className="section-label pt-2">What Success Actually Looks Like</div>
                <div className="content-measure text-[15px] leading-7 text-slack-text">
                  There is no clean win condition. Your job is to keep the story credible, answer quickly enough
                  that people do not route around you, and sound decisive without promising a version of reality
                  the team cannot survive.
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
                <div className="section-label">How Slack Signals Trouble</div>
                <div className="stack-sm text-sm leading-6 text-slack-text">
                  <p><span className="font-semibold text-slack-white">@mentions</span> usually mean someone wants an answer, not a thought process.</p>
                  <p><span className="font-semibold text-slack-white">Unread dots</span> are often noise until one of them quietly becomes your problem.</p>
                  <p><span className="font-semibold text-slack-white">DMs</span> are where people admit what they do not want attached to a public channel.</p>
                  <p><span className="font-semibold text-slack-white">Profiles</span> help with titles and vibes, not motives.</p>
                </div>

                <div className="section-label pt-2">Operating Advice</div>
                <div className="stack-sm text-sm leading-6 text-slack-text">
                  <p>Answer direct asks quickly, even when the answer is uncomfortable.</p>
                  <p>Use DMs to gather context, but pull real decisions back into the room that will remember them.</p>
                  <p>If you tag someone, make it clear why. Accountability language now matters.</p>
                </div>

                <div className="rounded-2xl border border-slack-link/20 bg-slack-link/8 px-4 py-4 text-sm leading-6 text-slack-text-secondary">
                  If a message looks like a real ask, assume your next reply may become the version of the plan people repeat.
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
