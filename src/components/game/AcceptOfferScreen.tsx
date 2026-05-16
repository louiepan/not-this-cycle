'use client';

import { useMemo, useState } from 'react';
import { DIFFICULTIES, type DifficultyConfig, type ScenarioWorld } from '@/engine/types';

interface AcceptOfferScreenProps {
  onAccept: (difficulty: DifficultyConfig, playerName: string) => void;
  initialPlayerName?: string;
  world: ScenarioWorld;
}

// Satirical, aspirational copy. Lowering the descriptions into the rules of
// the game while keeping the surface read like a real internal HR portal.
const LEVEL_COPY: Record<DifficultyConfig['id'], { name: string; pay: string; description: string }> = {
  junior: {
    name: 'Junior PM',
    pay: 'L3 · base $135K',
    description:
      'Smaller surface area. Patient stakeholders. Most pings can wait. Reviews skew kind.',
  },
  senior: {
    name: 'Senior PM',
    pay: 'L5 · base $215K',
    description:
      'Cross-functional ownership. Decision velocity expected. Stakeholders escalate quickly. Reviews skew honest.',
  },
  principal: {
    name: 'Principal PM',
    pay: 'L7 · base $310K',
    description:
      "Org-wide influence. Director sync on the calendar. Directors will contradict each other and you'll be expected to resolve it.",
  },
};

const FIRST_NAME = (full: string) => full.trim().split(/\s+/)[0] || 'there';

function MailSidebar({ playerName }: { playerName: string }) {
  return (
    <aside className="flex h-full w-[232px] flex-shrink-0 flex-col overflow-hidden border-r border-paper-border-subtle bg-paper-sidebar">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-paper-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] text-[11px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #5C5246, #3D362D)' }}
          >
            M
          </div>
          <div className="text-[13px] font-semibold tracking-tight text-paper-text-primary">Mail</div>
        </div>
      </div>

      <div className="px-3 py-2">
        <button
          className="flex w-full items-center gap-2 rounded-md border border-paper-border-default bg-paper-elevated px-3 py-1.5 text-left text-[12.5px] text-paper-text-secondary"
          style={{ boxShadow: 'var(--shadow-paper-sm)' }}
          type="button"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M11.5 2.5L9 5m2.5-2.5l-1.5-1L8 1.5 9 3l2.5-.5z" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M9 5l-6 6v2h2l6-6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          Compose
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <SidebarItem icon={InboxIcon} label="Inbox" active badge={1} />
        <SidebarItem icon={StarIcon} label="Starred" />
        <SidebarItem icon={SendIcon} label="Sent" />
        <SidebarItem icon={DraftIcon} label="Drafts" />
        <SidebarItem icon={ArchiveIcon} label="Archive" />
        <div className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-paper-text-tertiary">
          Folders
        </div>
        <SidebarItem icon={FolderIcon} label="Personal" />
        <SidebarItem icon={FolderIcon} label="Recruiters" />
      </nav>

      <div className="flex flex-shrink-0 items-center gap-2.5 border-t border-paper-border-subtle px-3 py-2.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6E6359, #45403A)' }}
        >
          {playerName
            .split(/\s+/)
            .map((p) => p[0]?.toUpperCase() ?? '')
            .join('')
            .slice(0, 2) || 'YO'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-paper-text-primary">
            {playerName || 'Your Full Name'}
          </div>
          <div className="truncate text-[11px] text-paper-text-tertiary">you@work.com</div>
        </div>
      </div>
    </aside>
  );
}

type IconComponent = (props: { className?: string }) => React.ReactElement;

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  badge,
}: {
  icon: IconComponent;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left text-[13px] transition-colors ${
        active
          ? 'bg-paper-elevated font-medium text-paper-text-primary'
          : 'text-paper-text-secondary hover:bg-paper-hover hover:text-paper-text-primary'
      }`}
      style={active ? { boxShadow: 'var(--shadow-paper-sm)' } : undefined}
    >
      <Icon className={active ? 'text-paper-text-secondary' : 'text-paper-text-tertiary'} />
      <span className="flex-1 truncate">{label}</span>
      {badge ? (
        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1.5 text-[10.5px] font-bold tabular-nums text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

const InboxIcon: IconComponent = ({ className }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className={className}>
    <path d="M2 4l5 4 5-4M2 4v6h10V4M2 4l5-2 5 2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
  </svg>
);

const StarIcon: IconComponent = ({ className }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className={className}>
    <path d="M7 2l1.5 3.3 3.5.4-2.6 2.4.7 3.5L7 9.8 3.9 11.6l.7-3.5L2 5.7l3.5-.4L7 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
  </svg>
);

const SendIcon: IconComponent = ({ className }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className={className}>
    <path d="M2.5 7l9-4-3.5 9-2-3.5-3.5-1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
  </svg>
);

const DraftIcon: IconComponent = ({ className }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className={className}>
    <path d="M3 2h6l3 3v7H3V2z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
  </svg>
);

const ArchiveIcon: IconComponent = ({ className }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className={className}>
    <path d="M2 4h10v8H2zM2 4l1-2h8l1 2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
  </svg>
);

const FolderIcon: IconComponent = ({ className }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className={className}>
    <path d="M2 4v7h10V5H7L6 4H2z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
  </svg>
);

export function AcceptOfferScreen({ onAccept, initialPlayerName = '', world }: AcceptOfferScreenProps) {
  const companyName = world.companyName;
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyConfig | null>(
    DIFFICULTIES.senior ?? null,
  );
  const playerName = initialPlayerName.trim();
  const greetingName = useMemo(() => FIRST_NAME(playerName), [playerName]);

  const handleAccept = () => {
    if (!selectedDifficulty) return;
    onAccept(selectedDifficulty, playerName);
  };

  return (
    <div
      className="flex h-full w-full overflow-hidden bg-paper-canvas text-paper-text-primary antialiased"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      <MailSidebar playerName={playerName} />

      <main className="flex flex-1 flex-col overflow-hidden bg-paper-canvas">
        {/* Crumb header */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-paper-border-subtle px-6 py-3">
          <button className="flex h-6 w-6 cursor-default items-center justify-center rounded text-paper-text-tertiary hover:bg-paper-hover hover:text-paper-text-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex items-center gap-2 text-[12.5px] text-paper-text-secondary">
            <span>Inbox</span>
            <span className="text-paper-text-quaternary">/</span>
            <span className="font-semibold text-paper-text-primary">Welcome to {companyName} — Your offer letter</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[720px] px-8 pb-16 pt-9">
            <h1 className="mb-5 text-[22px] font-bold leading-tight tracking-[-0.022em] text-paper-text-primary">
              Welcome to {companyName} — Your offer letter
            </h1>

            <div className="mb-8 flex items-start gap-3.5 border-b border-paper-border-subtle pb-6">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #4AA572, #2C7548)' }}
              >
                SP
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="text-[13.5px] font-semibold text-paper-text-primary">
                  Samira Patel
                  <span className="ml-1 text-[12.5px] font-normal text-paper-text-tertiary">
                    &lt;s.patel@helix.com&gt;
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-paper-text-tertiary">
                  to <span className="text-paper-text-secondary">{playerName ? 'you' : 'you@work.com'}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right text-[12px] text-paper-text-tertiary">
                <div className="font-medium text-paper-text-secondary">Today, 8:14 AM</div>
                <div>4 minutes ago</div>
              </div>
            </div>

            <div className="mb-7 flex items-center gap-3 border-b border-paper-border-subtle pb-5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-extrabold tracking-tight text-[#1a0e07]"
                style={{ background: 'linear-gradient(135deg, #e8915a, #c26b3d)' }}
              >
                H
              </div>
              <div className="leading-tight">
                <div className="text-[14px] font-bold tracking-tight text-paper-text-primary">{companyName}</div>
                <div className="mt-0.5 text-[11.5px] text-paper-text-tertiary">
                  142 Brannan St · San Francisco, CA
                </div>
              </div>
            </div>

            <article className="text-[14.5px] leading-[1.75] text-paper-text-primary">
              <p className="mb-4">{greetingName},</p>
              <p className="mb-4">
                It&apos;s a pleasure to formalize our offer for you to join the Product organization
                at {companyName}. After our conversations, the team is convinced you&apos;ll thrive here, and
                we&apos;re excited to have you.
              </p>
              <p className="mb-4">
                About your level: in the interest of transparency, we couldn&apos;t reach internal
                alignment on what to bring you in at. We&apos;ve narrowed it to three reasonable
                options below and would like you to pick the one that fits how you want to show up.
                The team is holding for your decision.
              </p>
              <p className="mb-4">
                You&apos;ll partner with me directly, with engineering led by Derek Walsh, and with
                design led by Tomás Reyes. Your initial surface area is cart recovery and retention.
                Growth has been moving quickly this quarter and you&apos;ll have meaningful ownership
                from day one.
              </p>
              <p className="mb-4">A few things to know about how we operate:</p>
              <ul className="mb-5 list-none space-y-2 pl-0">
                {[
                  'Our culture is direct. Stakeholders will reach out to you constantly. We trust you to prioritize.',
                  'We care more about decisions than alignment artifacts. Make calls.',
                  'Your first calibration cycle is closer than you think.',
                ].map((line) => (
                  <li key={line} className="relative pl-[22px]">
                    <span className="absolute left-1.5 top-[13px] h-[5px] w-[5px] rounded-full bg-paper-text-tertiary" />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mb-4">
                To proceed, please confirm your starting level below and accept this offer. Your Slack
                workspace and credentials will be provisioned automatically.
              </p>
              <p>Excited to have you on the team,</p>
              <div className="mt-8 leading-tight">
                <div className="text-[14.5px] font-semibold text-paper-text-primary">Samira Patel</div>
                <div className="mt-1 text-[12.5px] text-paper-text-tertiary">
                  Director of Product · {companyName}
                </div>
              </div>
            </article>

            <div
              className="mt-10 overflow-hidden rounded-[10px] border border-paper-border-subtle bg-paper-elevated"
              style={{ boxShadow: 'var(--shadow-paper-md)' }}
            >
              <div className="flex items-center gap-2 border-b border-paper-border-subtle px-5 py-4">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-accent">
                  <span className="h-[5px] w-[5px] rotate-45 bg-accent" />
                  Action required
                </span>
                <span className="text-[13.5px] font-semibold text-paper-text-primary">
                  Confirm your starting level
                </span>
              </div>

              <div className="flex flex-col gap-1 p-3">
                {Object.values(DIFFICULTIES).map((diff) => {
                  const copy = LEVEL_COPY[diff.id];
                  const isSelected = selectedDifficulty?.id === diff.id;
                  return (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`flex items-start gap-3.5 rounded-lg border px-4 py-3.5 text-left transition-colors ${
                        isSelected
                          ? 'border-accent-border bg-paper-canvas'
                          : 'border-transparent hover:bg-paper-canvas'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                          isSelected ? 'border-accent bg-accent-soft' : 'border-paper-text-tertiary bg-paper-elevated'
                        }`}
                      >
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 text-[14px] font-semibold tracking-tight text-paper-text-primary">
                          {copy.name}
                          <span className="font-mono text-[11px] font-medium text-paper-text-tertiary">
                            {copy.pay}
                          </span>
                        </div>
                        <div className="mt-1 text-[12.5px] leading-[1.55] text-paper-text-secondary">
                          {copy.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3.5 border-t border-paper-border-subtle bg-paper-panel px-5 py-4">
                <div className="flex-1 text-[11px] leading-[1.5] text-paper-text-tertiary">
                  By accepting, you agree to {companyName}&apos;s standard onboarding terms, including a
                  90-day calibration window and acknowledgment that the cycle compresses time.
                </div>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={!selectedDifficulty}
                  className="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md border-0 bg-accent px-5 py-2.5 text-[13.5px] font-bold tracking-tight text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ boxShadow: '0 1px 2px rgba(168, 86, 40, 0.25)' }}
                >
                  Accept Offer
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
