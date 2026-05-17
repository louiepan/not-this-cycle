'use client';

import { RatingEngine } from '@/engine/RatingEngine';
import type { CalibrationBucket, RatingResult, ScenarioWorld, Stakeholder } from '@/engine/types';
import { EvaluationPanel } from '@/components/eval/EvaluationPanel';

interface ReviewScreenProps {
  result: RatingResult;
  stakeholders: Stakeholder[];
  playerName: string;
  world: ScenarioWorld;
  sessionId?: string | null;
  onPlayAgain: () => void;
  /**
   * Satirical continuity lines that reference prior runs. Computed by the
   * caller from localStorage history. Empty array on first-ever run.
   */
  continuityLines?: string[];
}

const BUCKET_LABELS: Record<CalibrationBucket, string> = {
  needs_improvement: 'Needs Improvement',
  partially_meets: 'Partially Meets',
  meets_expectations: 'Meets Expectations',
  exceeds_expectations: 'Exceeds Expectations',
  strongly_exceeds: 'Strongly Exceeds',
};

const BUCKET_DESCRIPTIONS: Record<CalibrationBucket, string> = {
  needs_improvement:
    'You operated below the bar expected of your level this cycle. Calibration committee flagged systemic gaps that will need a documented improvement plan.',
  partially_meets:
    "You operated below the bar in places. There's a clear path back to expectations, but it requires deliberate change next cycle.",
  meets_expectations:
    'You operated at the bar expected of your level. Strong on judgment, room to grow on cross-functional clarity. Final placement reflects committee consensus across partner reviewers.',
  exceeds_expectations:
    'You operated above the bar this cycle. Calibration committee noted consistent decision quality and trusted execution.',
  strongly_exceeds:
    'You operated well above the bar. Calibration committee surfaced you as a top-of-cohort contributor with cross-org impact.',
};

// Forced distribution across the cohort, summing to 100%.
const DISTRIBUTION: Array<{ bucket: CalibrationBucket; pct: number; short: string; full: string }> = [
  { bucket: 'needs_improvement', pct: 5, short: '5%', full: 'Needs\nimprovement' },
  { bucket: 'partially_meets', pct: 15, short: '15%', full: 'Below\nexpectations' },
  { bucket: 'meets_expectations', pct: 50, short: '50%', full: 'Meets\nexpectations' },
  { bucket: 'exceeds_expectations', pct: 25, short: '25%', full: 'Exceeds\nexpectations' },
  { bucket: 'strongly_exceeds', pct: 5, short: '5%', full: 'Strongly\nexceeds' },
];

function pinPosition(bucket: CalibrationBucket): number {
  let cursor = 0;
  for (const segment of DISTRIBUTION) {
    if (segment.bucket === bucket) return cursor + segment.pct / 2;
    cursor += segment.pct;
  }
  return 50;
}

function isPromotionDeferred(outcome: string): boolean {
  // Only the "committee meets" path keeps candidacy alive; all others defer.
  return !outcome.includes('committee meets');
}

const FOCUS_AREAS = [
  'Cultivate executive sponsorship from VP-level or above',
  'Build cross-org influence beyond Growth, with documented partners',
  'Demonstrate a track record of decision velocity under sustained pressure',
  'Earn a manager testimonial reflecting promotion readiness',
];

interface VarRow {
  label: string;
  value: number;
  inverted: boolean;
}

function variableHealth(v: VarRow): 'positive' | 'neutral' | 'concern' {
  const effective = v.inverted ? 100 - v.value : v.value;
  if (effective >= 70) return 'positive';
  if (effective >= 50) return 'neutral';
  return 'concern';
}

const HEALTH_COLOR: Record<'positive' | 'neutral' | 'concern', string> = {
  positive: 'bg-positive',
  neutral: 'bg-neutral-tone',
  concern: 'bg-concern',
};

const TODAY = new Date().toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

function avatarGradient(seed: string): string {
  const palettes: Array<[string, string]> = [
    ['#4a6fa5', '#2c4a75'],
    ['#a55e4a', '#75382c'],
    ['#4aa572', '#2c7548'],
    ['#8a4aa5', '#5c2c75'],
    ['#a5984a', '#75682c'],
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const [from, to] = palettes[Math.abs(hash) % palettes.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

export function ReviewScreen({
  result,
  stakeholders,
  playerName,
  world,
  sessionId,
  onPlayAgain,
  continuityLines = [],
}: ReviewScreenProps) {
  const companyInitial = world.companyName.charAt(0).toUpperCase() || 'C';
  const archetypeInfo = RatingEngine.ARCHETYPE_LABELS[result.archetype];
  const promotionDeferred = isPromotionDeferred(result.calibrationOutcome);
  const personalizedManagerReview = result.managerReview.replaceAll('[Player]', playerName);
  const managerStakeholder = stakeholders.find((s) => s.id === 'the-manager');
  const managerName = managerStakeholder?.name || 'Your Manager';

  const variables: VarRow[] = [
    { label: 'Product judgment', value: result.variables.productJudgment, inverted: false },
    { label: 'Communication effectiveness', value: result.variables.communicationEffectiveness, inverted: false },
    { label: 'Executive trust', value: result.variables.execTrust, inverted: false },
    { label: 'Tech debt accrued', value: result.variables.techDebt, inverted: true },
    { label: 'Responsiveness debt', value: result.variables.responsivenessDebt, inverted: true },
  ];

  const peerFeedbackByStakeholder = result.peerFeedback.map((feedback) => {
    const stakeholder = stakeholders.find((s) => s.id === feedback.stakeholderId);
    return {
      ...feedback,
      name: stakeholder?.name || 'Anonymous',
      role: stakeholder?.role || 'Reviewer',
    };
  });

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-paper-canvas text-paper-text-primary antialiased"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {/* ============ Top bar ============ */}
      <header className="flex flex-shrink-0 items-center gap-6 border-b border-paper-border-subtle bg-paper-elevated px-6 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-[13px] font-extrabold tracking-tight text-[#1a0e07]"
            style={{ background: 'linear-gradient(135deg, #e8915a, #c26b3d)' }}
          >
            {companyInitial}
          </div>
          <div className="leading-tight">
            <div className="text-[13.5px] font-bold tracking-tight">{world.companyName}</div>
            <div className="mt-px text-[11px] text-paper-text-tertiary">Calibration</div>
          </div>
        </div>
        <div className="h-5 w-px bg-paper-border-default" />
        <nav className="flex items-center gap-1">
          <span className="rounded-md bg-paper-canvas px-3 py-1.5 text-[13px] font-semibold text-paper-text-primary">
            My Cycle
          </span>
        </nav>
        <div className="flex-1" />
        <span className="inline-flex items-center gap-2 rounded-full border border-paper-border-subtle bg-paper-canvas px-3 py-1 text-[11.5px] font-medium text-paper-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-tone" />
          Review date: {TODAY}
        </span>
        <div className="flex items-center gap-2.5">
          <div className="text-right leading-tight">
            <div className="text-[12.5px] font-semibold text-paper-text-primary">{playerName}</div>
            <div className="text-[11px] text-paper-text-tertiary">Senior PM · Growth</div>
          </div>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md text-[12px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6E6359, #45403A)' }}
          >
            {initials(playerName)}
          </div>
        </div>
      </header>

      {/* ============ Scrollable content ============ */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[880px] px-8 pb-16 pt-8">
          {/* Page header */}
          <div className="mb-7 flex items-start justify-between gap-6 border-b border-paper-border-subtle pb-6">
            <div>
              <span className="mb-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-accent">
                <span className="h-[5px] w-[5px] rotate-45 bg-accent" />
                Calibration cycle
              </span>
              <h1 className="text-[28px] font-bold leading-[1.2] tracking-[-0.022em]">
                Your performance review
              </h1>
              <div className="mt-2.5 flex items-center gap-2.5 text-[13px] text-paper-text-tertiary">
                <span>
                  Reviewed by <span className="text-paper-text-secondary">{managerName}</span>
                </span>
                <span className="text-paper-text-quaternary">·</span>
                <span>Director of Product</span>
                <span className="text-paper-text-quaternary">·</span>
                <span>Released minutes ago</span>
              </div>
            </div>
            <span className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-paper-border-subtle bg-paper-elevated px-3 py-1.5 text-[11.5px] font-semibold text-paper-text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-tone" />
              Calibration finalized
            </span>
          </div>

          {/* ========= Calibration outcome ========= */}
          <Card>
            <div className="px-6 pb-6 pt-7">
              <div className="mb-6 flex items-baseline justify-between gap-3">
                <div>
                  <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-paper-text-tertiary">
                    Cycle outcome
                  </div>
                  <div className="text-[36px] font-bold leading-[1.1] tracking-[-0.025em]">
                    {BUCKET_LABELS[result.calibrationBucket]}
                  </div>
                  <p className="mt-2 max-w-[56ch] text-[14px] leading-[1.6] text-paper-text-secondary">
                    {BUCKET_DESCRIPTIONS[result.calibrationBucket]}
                  </p>
                </div>
              </div>

              {/* Distribution */}
              <div className="rounded-[10px] border border-paper-border-subtle bg-paper-canvas px-4 pb-3.5 pt-4">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-paper-text-tertiary">
                  Cohort distribution · Q4 PM org
                </div>
                <div className="flex h-8 w-full overflow-hidden rounded-md border border-paper-border-subtle">
                  {DISTRIBUTION.map((segment) => {
                    const isYou = segment.bucket === result.calibrationBucket;
                    return (
                      <div
                        key={segment.bucket}
                        className={`flex h-full items-center justify-center border-r border-paper-border-subtle text-[11px] font-bold tabular-nums last:border-r-0 ${
                          isYou
                            ? 'bg-accent-soft text-accent-strong'
                            : 'bg-paper-elevated text-paper-text-tertiary'
                        }`}
                        style={{
                          width: `${segment.pct}%`,
                          boxShadow: isYou ? 'inset 0 0 0 2px var(--color-accent)' : undefined,
                        }}
                      >
                        {segment.short}
                      </div>
                    );
                  })}
                </div>
                {/* Pin */}
                <div className="relative mt-2.5 h-6">
                  <div
                    className="absolute flex flex-col items-center"
                    style={{ left: `${pinPosition(result.calibrationBucket)}%`, transform: 'translateX(-50%)' }}
                  >
                    <div
                      className="mb-0.5 h-0 w-0"
                      style={{
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderBottom: '6px solid var(--color-accent)',
                      }}
                    />
                    <div
                      className="rounded-xl border border-accent-border bg-paper-elevated px-2 py-0.5 text-[11px] font-bold leading-tight text-accent-strong"
                    >
                      You · {BUCKET_LABELS[result.calibrationBucket].split(' ')[0]}
                    </div>
                  </div>
                </div>
                {/* Axis */}
                <div className="mt-2 flex w-full text-[10.5px] font-medium leading-tight text-paper-text-tertiary">
                  {DISTRIBUTION.map((segment) => (
                    <div
                      key={segment.bucket}
                      className="text-center"
                      style={{ width: `${segment.pct}%`, whiteSpace: 'pre-line' }}
                    >
                      {segment.full}
                    </div>
                  ))}
                </div>
              </div>

              {/* Promotion strip */}
              <div
                className="mt-5 flex items-center gap-3.5 rounded-[9px] border border-concern bg-concern-soft px-4 py-3.5"
              >
                <span className="flex-shrink-0 rounded bg-concern px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                  {promotionDeferred ? 'Promotion deferred' : 'Promotion pending'}
                </span>
                <span className="flex-1 text-[13px] leading-[1.5] text-paper-text-primary">
                  <strong className="font-semibold">Promotion to Staff Product Manager:</strong>{' '}
                  {promotionDeferred ? 'not advanced this cycle.' : 'pending committee.'}{' '}
                  Focus areas documented below.
                </span>
              </div>
            </div>
          </Card>

          {/* ========= Archetype ========= */}
          <Card>
            <CardHeader eyebrow="Detected pattern" title="Operating archetype" meta="inferred from decision history" />
            <div className="grid grid-cols-[96px_1fr] items-start gap-5 p-6">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-xl text-[56px] leading-none text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-strong))',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  letterSpacing: '-0.04em',
                }}
              >
                {archetypeInfo.name.replace(/^The\s+/i, '').charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-[24px] font-bold leading-tight tracking-[-0.022em] text-paper-text-primary">
                  {archetypeInfo.name}
                </div>
                <div className="mt-1 text-[13.5px] font-semibold text-accent-strong">
                  Match confidence aggregated from your decision history.
                </div>
                <p className="mt-3 text-[13.5px] leading-[1.65] text-paper-text-secondary">
                  {archetypeInfo.description}
                </p>
              </div>
            </div>
          </Card>

          {/* ========= Variables ========= */}
          <Card>
            <CardHeader
              eyebrow="Signals"
              title="Performance variables"
              meta="aggregated from this cycle's decision events"
            />
            <div className="px-6 pb-6 pt-4">
              <div className="flex flex-col">
                {variables.map((v, i) => {
                  const health = variableHealth(v);
                  return (
                    <div
                      key={v.label}
                      className={`grid grid-cols-[180px_1fr_60px] items-center gap-[18px] py-3.5 ${
                        i < variables.length - 1 ? 'border-b border-paper-border-subtle' : ''
                      } ${i === 0 ? '!pt-0' : ''}`}
                    >
                      <div className="text-[13px] font-medium text-paper-text-primary">
                        {v.label}
                        {v.inverted && (
                          <span className="ml-1.5 text-[10.5px] font-medium text-paper-text-tertiary">
                            lower is better
                          </span>
                        )}
                      </div>
                      <div className="h-2 overflow-hidden rounded-[4px] border border-paper-border-subtle bg-paper-canvas">
                        <div
                          className={`h-full rounded-[3px] ${HEALTH_COLOR[health]}`}
                          style={{ width: `${v.value}%` }}
                        />
                      </div>
                      <div className="text-right font-mono text-[13px] font-semibold tabular-nums text-paper-text-primary">
                        {v.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* ========= HR continuing notes (only if prior cycles exist) ========= */}
          {continuityLines.length > 0 && (
            <Card>
              <CardHeader
                eyebrow="From your file"
                title="HR continuing notes"
                meta={`${continuityLines.length} ${continuityLines.length === 1 ? 'entry' : 'entries'}`}
              />
              <div className="p-6">
                <ul className="space-y-3">
                  {continuityLines.map((line, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-[14px] leading-[1.7] text-paper-text-primary"
                    >
                      <span
                        className="mt-[10px] h-[5px] w-[5px] flex-shrink-0 rotate-45 bg-accent"
                        aria-hidden="true"
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-lg border border-paper-border-subtle bg-paper-canvas px-3.5 py-3 text-[12px] leading-[1.55] text-paper-text-tertiary">
                  <strong className="mb-1 block text-[10.5px] font-bold uppercase tracking-[0.04em] text-paper-text-secondary">
                    Note
                  </strong>
                  Continuity entries are surfaced automatically based on patterns
                  detected in your prior calibration cycles. They are advisory only
                  and do not factor into your calibration bucket.
                </div>
              </div>
            </Card>
          )}

          {/* ========= Manager review ========= */}
          <Card>
            <CardHeader eyebrow="Written review" title="Manager commentary" />
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white"
                  style={{ background: avatarGradient(managerName) }}
                >
                  {initials(managerName)}
                </div>
                <div className="leading-tight">
                  <div className="text-[13.5px] font-semibold text-paper-text-primary">{managerName}</div>
                  <div className="mt-0.5 text-[11.5px] text-paper-text-tertiary">
                    Director of Product · your manager
                  </div>
                </div>
              </div>
              <div className="text-[14px] leading-[1.7] text-paper-text-primary">
                <p>{personalizedManagerReview}</p>
              </div>
              <div className="mt-4 rounded-lg border border-paper-border-subtle bg-paper-canvas px-3.5 py-3 text-[12px] leading-[1.55] text-paper-text-tertiary">
                <strong className="mb-1 block text-[10.5px] font-bold uppercase tracking-[0.04em] text-paper-text-secondary">
                  Calibration committee note
                </strong>
                Final placement reflects consensus across partner reviewers. Ratings were normalized
                against the cohort distribution. Outstanding feedback items are surfaced in your
                career framework.
              </div>
            </div>
          </Card>

          {/* ========= Peer feedback ========= */}
          {peerFeedbackByStakeholder.length > 0 && (
            <Card>
              <CardHeader
                eyebrow="360 inputs"
                title="Peer feedback"
                meta={`${peerFeedbackByStakeholder.length} reviewers · anonymized below the manager line`}
              />
              <div className="px-6 pb-6 pt-3">
                <div className="flex flex-col">
                  {peerFeedbackByStakeholder.map((entry, i) => (
                    <div
                      key={`${entry.stakeholderId}-${i}`}
                      className={`grid grid-cols-[40px_1fr] items-start gap-3.5 py-4 ${
                        i < peerFeedbackByStakeholder.length - 1
                          ? 'border-b border-paper-border-subtle'
                          : ''
                      } ${i === 0 ? '!pt-0' : ''}`}
                    >
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-semibold text-white"
                        style={{ background: avatarGradient(entry.name) }}
                      >
                        {initials(entry.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[13.5px] font-semibold text-paper-text-primary">
                            {entry.name}
                          </span>
                          <span className="text-[11.5px] font-medium text-paper-text-tertiary">
                            {entry.role}
                          </span>
                        </div>
                        <div className="mt-1.5 text-[13.5px] leading-[1.6] text-paper-text-primary">
                          &ldquo;{entry.feedback}&rdquo;
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* ========= Development plan ========= */}
          <Card>
            <CardHeader eyebrow="Development plan" title="Focus areas for next cycle" />
            <div className="grid grid-cols-1 gap-7 p-6 lg:grid-cols-[1fr_280px]">
              <div>
                <div className="text-[22px] font-bold leading-[1.25] tracking-[-0.02em] text-paper-text-primary">
                  Where to invest next cycle
                </div>
                <p className="mt-3.5 text-[13.5px] leading-[1.65] text-paper-text-secondary">
                  Committee identified these as the highest-leverage areas to develop. Sustained
                  progress here positions you well for future consideration. Specific milestones to
                  be calibrated with your manager.
                </p>
              </div>
              <div className="rounded-[10px] border border-paper-border-subtle bg-paper-canvas px-4 pb-3.5 pt-4">
                <div className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-paper-text-tertiary">
                  Focus areas
                </div>
                {FOCUS_AREAS.map((item) => (
                  <div
                    key={item}
                    className="grid grid-cols-[14px_1fr] items-start gap-2 py-1.5 text-[12.5px] leading-[1.5] text-paper-text-primary"
                  >
                    <span className="mt-[2px] inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border-[1.5px] border-paper-text-tertiary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ========= Evaluation panel (deterministic findings + recs) ========= */}
          {sessionId && <EvaluationPanel sessionId={sessionId} />}

          {/* ========= Footer CTA ========= */}
          <div className="mt-7 flex items-center gap-4 rounded-xl border border-paper-border-subtle bg-paper-panel p-5">
            <div className="flex-1 leading-[1.55]">
              <div className="text-[14px] font-semibold text-paper-text-primary">
                Begin your next cycle?
              </div>
              <div className="mt-1 text-[12.5px] text-paper-text-tertiary">
                Calibration is closed. Onboarding for the next cycle starts when you are.
              </div>
            </div>
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md border-0 bg-accent px-4 py-2.5 text-[13.5px] font-bold tracking-tight text-white transition-colors hover:bg-accent-strong"
              style={{ boxShadow: '0 1px 2px rgba(168, 86, 40, 0.25)' }}
            >
              Begin next cycle
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-5 overflow-hidden rounded-xl border border-paper-border-subtle bg-paper-elevated"
      style={{ boxShadow: 'var(--shadow-paper-sm)' }}
    >
      {children}
    </div>
  );
}

function CardHeader({ eyebrow, title, meta }: { eyebrow: string; title: string; meta?: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-paper-border-subtle px-6 pb-3.5 pt-4">
      <span className="flex-shrink-0 text-[10.5px] font-bold uppercase tracking-[0.07em] text-paper-text-tertiary">
        {eyebrow}
      </span>
      <span className="flex-1 text-[15px] font-semibold tracking-tight text-paper-text-primary">{title}</span>
      {meta && <span className="text-[11.5px] text-paper-text-tertiary">{meta}</span>}
    </div>
  );
}
