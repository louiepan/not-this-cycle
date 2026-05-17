'use client';

import type { DifficultyConfig, ScenarioWorld, Stakeholder } from '@/engine/types';

interface MorningBriefProps {
  difficulty: DifficultyConfig;
  playerName: string;
  world: ScenarioWorld;
  // Stakeholders resolved for this session (names + roles). Used to render
  // the cast list so the player has met the names before the chaos starts.
  stakeholders: Stakeholder[];
  onContinue: () => void;
  onBack: () => void;
}

// Order the cast list by relevance to the first ~30 seconds of play.
// The VP and Manager drive the opening decisions; Staff Eng and Design Lead
// own the constraint conversations the player will lean on; the rest follow.
const CAST_ORDER = [
  'the-vp',
  'the-manager',
  'the-staff-eng',
  'the-design-lead',
  'the-tpm',
  'the-data-analyst',
  'the-adjacent-pm',
];

function orderCast(stakeholders: Stakeholder[]): Stakeholder[] {
  const byId = new Map(stakeholders.map((s) => [s.id, s]));
  const ordered: Stakeholder[] = [];
  for (const id of CAST_ORDER) {
    const found = byId.get(id);
    if (found) ordered.push(found);
  }
  // Any stakeholders not in the explicit order go at the end, stable.
  for (const s of stakeholders) {
    if (!CAST_ORDER.includes(s.id)) ordered.push(s);
  }
  return ordered;
}

export function MorningBrief({
  difficulty,
  playerName,
  world,
  stakeholders,
  onContinue,
  onBack,
}: MorningBriefProps) {
  const cast = orderCast(stakeholders);

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
          <span className="font-semibold text-slack-text">
            Day 1 briefing · {difficulty.label}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-8 pb-16 pt-9">
          <span className="mb-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slack-link">
            <span className="h-[5px] w-[5px] rotate-45 bg-slack-link" />
            Day 1 · context pack
          </span>
          <h1 className="text-[28px] font-bold leading-[1.2] tracking-[-0.022em] text-slack-text">
            Welcome to {world.companyName}, {playerName}.
          </h1>
          <p className="mt-3 max-w-[58ch] text-[14.5px] leading-[1.65] text-slack-text-muted">
            You start at 9:00 AM. The team is mid-quarter and the day is already
            in motion. The next three minutes of Slack is your first day on the
            job. Read fast, answer cleanly, and remember that public channels
            are partly for solving things and partly for being seen solving them.
          </p>

          {/* Card: The company */}
          <div className="mt-7 overflow-hidden rounded-xl border border-slack-divider bg-slack-sidebar">
            <div className="flex items-baseline gap-3 border-b border-slack-divider px-5 pb-3 pt-4">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-slack-text-secondary">
                The company
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-slack-text">
                {world.companyName}
              </span>
              <span className="ml-auto text-[11.5px] text-slack-text-secondary">
                {world.stage}
              </span>
            </div>
            <div className="space-y-3 px-5 py-5 text-[13.5px] leading-[1.65] text-slack-text">
              <p>
                <span className="font-semibold text-slack-text">What it is.</span>{' '}
                {world.productDescription.charAt(0).toUpperCase() + world.productDescription.slice(1)}.
              </p>
              <p>
                <span className="font-semibold text-slack-text">This year.</span>{' '}
                The board is watching three things:
              </p>
              <ul className="space-y-1.5 pl-4 text-slack-text-muted">
                {world.annualThemes.map((theme) => (
                  <li key={theme} className="list-disc">
                    {theme}
                  </li>
                ))}
              </ul>
              <p className="text-slack-text-muted">
                <span className="font-semibold text-slack-text">The pressure:</span>{' '}
                {world.boardPressure}
              </p>
            </div>
          </div>

          {/* Card: Your role */}
          <div className="mt-5 overflow-hidden rounded-xl border border-slack-divider bg-slack-sidebar">
            <div className="flex items-baseline gap-3 border-b border-slack-divider px-5 pb-3 pt-4">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-slack-text-secondary">
                Your team
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-slack-text">
                {world.teamName}
              </span>
            </div>
            <div className="space-y-3 px-5 py-5 text-[13.5px] leading-[1.65] text-slack-text">
              <p>
                <span className="font-semibold text-slack-text">Charter.</span>{' '}
                {world.teamCharter}
              </p>
              <p>
                <span className="font-semibold text-slack-text">Your mandate today.</span>{' '}
                {world.mandate}
              </p>
              <p className="text-slack-text-muted">
                <span className="font-semibold text-slack-text">About the seat.</span>{' '}
                {world.predecessorContext}
              </p>
            </div>
          </div>

          {/* Card: What good looks like today */}
          <div className="mt-5 overflow-hidden rounded-xl border border-slack-divider bg-slack-sidebar">
            <div className="flex items-baseline gap-3 border-b border-slack-divider px-5 pb-3 pt-4">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-slack-text-secondary">
                Your goals
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-slack-text">
                What credible looks like today
              </span>
            </div>
            <div className="px-5 py-5">
              <ol className="space-y-3 text-[13.5px] leading-[1.65] text-slack-text">
                {world.successCriteria.map((criterion, index) => {
                  const [headline, ...rest] = criterion.split('. ');
                  const body = rest.join('. ');
                  return (
                    <li key={index} className="grid grid-cols-[24px_1fr] gap-2.5">
                      <span className="mt-[1px] inline-flex h-[20px] w-[20px] items-center justify-center rounded-full border border-slack-divider bg-slack-bg text-[11.5px] font-bold tabular-nums text-slack-text-secondary">
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-slack-text">
                          {headline}{body ? '.' : ''}
                        </span>
                        {body && (
                          <span className="text-slack-text-muted">{' '}{body}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
              {world.successCriteriaFooter && (
                <p className="mt-4 border-t border-slack-divider pt-4 text-[12.5px] italic leading-[1.6] text-slack-text-secondary">
                  {world.successCriteriaFooter}
                </p>
              )}
            </div>
          </div>

          {/* Card: The cast */}
          <div className="mt-5 overflow-hidden rounded-xl border border-slack-divider bg-slack-sidebar">
            <div className="flex items-baseline gap-3 border-b border-slack-divider px-5 pb-3 pt-4">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-slack-text-secondary">
                The cast
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-slack-text">
                Who you&apos;ll work with
              </span>
              <span className="ml-auto text-[11.5px] text-slack-text-secondary">
                names rotate per session
              </span>
            </div>
            <div className="grid grid-cols-1 gap-px bg-slack-divider md:grid-cols-2">
              {cast.map((person) => (
                <CastBlock
                  key={person.id}
                  name={person.name}
                  role={person.role}
                  cue={person.personality.communicationStyle}
                />
              ))}
            </div>
          </div>

          {/* Card: Slack mechanics */}
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
              <p><span className="font-semibold text-slack-text">Dimmed history</span> at the top of channels is yesterday&apos;s context. Skim it. Don&apos;t reply to it.</p>
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
              Start your day
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

function CastBlock({ name, role, cue }: { name: string; role: string; cue: string }) {
  return (
    <div className="bg-slack-sidebar p-4">
      <div className="flex items-baseline gap-2">
        <span className="text-[13.5px] font-semibold text-slack-text">{name}</span>
        <span className="text-[11.5px] font-medium text-slack-text-secondary">{role}</span>
      </div>
      <div className="mt-1 text-[12.5px] leading-[1.5] text-slack-text-muted">
        {cue}
      </div>
    </div>
  );
}
