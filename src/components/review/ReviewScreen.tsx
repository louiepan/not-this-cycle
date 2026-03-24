'use client';

import { RatingEngine } from '@/engine/RatingEngine';
import type { RatingResult, Stakeholder, CalibrationBucket } from '@/engine/types';

interface ReviewScreenProps {
  result: RatingResult;
  stakeholders: Stakeholder[];
  playerName: string;
  onPlayAgain: () => void;
}

const BUCKET_LABELS: Record<CalibrationBucket, string> = {
  needs_improvement: 'NEEDS IMPROVEMENT',
  partially_meets: 'PARTIALLY MEETS',
  meets_expectations: 'MEETS MOST EXPECTATIONS',
  exceeds_expectations: 'EXCEEDS EXPECTATIONS',
  strongly_exceeds: 'STRONGLY EXCEEDS',
};

const BUCKET_EMOJI: Record<CalibrationBucket, string> = {
  needs_improvement: '😞',
  partially_meets: '😐',
  meets_expectations: '😐',
  exceeds_expectations: '🙂',
  strongly_exceeds: '😊',
};

function getQualitativeLabel(value: number, inverted: boolean): { text: string; color: string } {
  const effective = inverted ? 100 - value : value;
  if (effective >= 70) return { text: 'ALIGNED', color: 'text-slack-green' };
  if (effective >= 50) return { text: 'DEVELOPMENT NEEDED', color: 'text-slack-yellow' };
  return { text: 'NEEDS IMPROVEMENT', color: 'text-slack-red' };
}

function getConvictionLabel(score: number): { rating: string; label: string } {
  const scaled = Math.round(score * 10 * 10) / 10;
  if (score >= 0.7) return { rating: `${scaled}/10`, label: 'HIGH: Clear point of view' };
  if (score >= 0.4) return { rating: `${scaled}/10`, label: 'MEDIUM: Inconsistent positions' };
  return { rating: `${scaled}/10`, label: 'LOW: Limited visibility' };
}

function parseCalibrationOutcome(text: string): { comp: string; promotion: string } {
  const compMatch = text.match(/Comp adjustment:\s*([^.]+)/i);
  const comp = compMatch ? compMatch[1].trim().toUpperCase() : '+0.0%';

  if (text.includes('improvement plan')) {
    return { comp: '+0.0% ADJUSTMENT', promotion: 'PERFORMANCE IMPROVEMENT PLAN INITIATED' };
  }
  if (text.includes('next cycle')) {
    return { comp: `${comp} ADJUSTMENT`, promotion: 'UNDER CONSIDERATION — NEXT CYCLE' };
  }
  if (text.includes('committee meets')) {
    return { comp: `${comp} ADJUSTMENT`, promotion: 'STRONG CANDIDACY — PENDING COMMITTEE' };
  }
  if (text.includes('H2')) {
    return { comp: `${comp} ADJUSTMENT`, promotion: 'DEFERRED — RE-EVALUATE H2' };
  }
  return { comp: `${comp} ADJUSTMENT`, promotion: 'DEFERRED — RE-EVALUATE Q2' };
}

function personalizeReviewText(text: string, playerName: string): string {
  return text.replaceAll('[Player]', playerName);
}

export function ReviewScreen({ result, stakeholders, playerName, onPlayAgain }: ReviewScreenProps) {
  const archetypeInfo = RatingEngine.ARCHETYPE_LABELS[result.archetype];
  const convictionInfo = getConvictionLabel(result.conviction.score);
  const calibration = parseCalibrationOutcome(result.calibrationOutcome);
  const personalizedManagerReview = personalizeReviewText(result.managerReview, playerName);

  const managerStakeholder = stakeholders.find((s) => s.id === 'the-manager');
  const managerName = managerStakeholder?.name || 'Your Manager';

  const visibleFeedback = result.peerFeedback;

  const variables: { label: string; value: number; inverted: boolean }[] = [
    { label: 'EXEC TRUST', value: result.variables.execTrust, inverted: false },
    { label: 'COMMUNICATION', value: result.variables.communicationEffectiveness, inverted: false },
    { label: 'TEAM MORALE', value: result.variables.teamMorale, inverted: false },
    { label: 'PRODUCT JUDGMENT', value: result.variables.productJudgment, inverted: false },
    { label: 'TECH DEBT', value: result.variables.techDebt, inverted: true },
    { label: 'RESPONSIVENESS', value: result.variables.responsivenessDebt, inverted: true },
  ];

  return (
    <div className="h-screen w-screen bg-[#0d0f11] overflow-y-auto">
      <div className="h-12 bg-[#15181c] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button className="text-slack-text-secondary cursor-default">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <span className="font-bold text-sm text-white tracking-wider uppercase">
            Performance Review 2024 - Q4
          </span>
        </div>
        <span className="text-xs text-slack-text-secondary leading-tight text-right">
          Not<br/>This<br/>Cycle
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <section className="screen-shell overflow-hidden">
          <div className="screen-header">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="content-measure space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/6 text-3xl">
                    {BUCKET_EMOJI[result.calibrationBucket]}
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slack-text-secondary">
                      Performance Rating
                    </div>
                    <h1 className="mt-1 text-3xl font-black uppercase tracking-[0.06em] text-white md:text-4xl">
                      {BUCKET_LABELS[result.calibrationBucket]}
                    </h1>
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="content-measure-narrow">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slack-text-secondary">
                      Archetype
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <h2 className="text-2xl font-black uppercase tracking-[0.05em] text-white md:text-3xl">
                        {archetypeInfo.name}
                      </h2>
                      <span className="text-2xl">🔧</span>
                    </div>
                    <p className="mt-2 max-w-xl text-base italic text-slack-text-secondary">
                      {archetypeInfo.description}
                    </p>
                  </div>

                  <div className="panel panel-muted min-w-[220px]">
                    <div className="section-label text-slack-text-secondary">
                      Conviction
                    </div>
                    <div className="mt-2 flex items-end gap-3">
                      <span className="text-3xl font-black text-white">{convictionInfo.rating}</span>
                      <span className="pb-1 text-sm text-slack-text-secondary">{convictionInfo.label}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:max-w-sm">
                <div className="panel border-slack-red/30 bg-slack-red/8 content-measure-narrow">
                  <div className="section-label text-slack-red">
                    Calibration Outcome
                  </div>
                  <div className="mt-3 space-y-2 text-sm font-mono leading-relaxed text-white/92">
                    <div>COMPENSATION: {calibration.comp}</div>
                    <div>PROMOTION STATUS: {calibration.promotion}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="screen-body lg:border-r lg:border-white/8">
              <div className="mb-5 flex items-baseline justify-between">
                <div className="content-measure-narrow">
                  <div className="section-label text-slack-text-secondary">
                    Score Breakdown
                  </div>
                  <p className="mt-1 text-sm text-slack-text-secondary">
                    The official explanation for what everyone already decided in advance.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {variables.map((v) => {
                  const qual = getQualitativeLabel(v.value, v.inverted);
                  return (
                    <div key={v.label} className="panel">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium tracking-[0.04em] text-white/90">{v.label}</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${qual.color}`}>
                            {qual.text}
                          </span>
                          <span className="min-w-12 text-right font-bold tabular-nums text-white">{v.value}%</span>
                        </div>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#2a2e34]">
                        <div
                          className="h-full rounded-full bg-slack-link transition-all duration-700"
                          style={{ width: `${v.value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="screen-body">
              <div className="section-label text-slack-text-secondary">
                Review Commentary
              </div>
              <p className="mt-1 text-sm text-slack-text-secondary">
                Official framing up top, calibration excerpts underneath.
              </p>

              <div className="mt-5 space-y-4">
                <div className="panel panel-muted content-measure">
                  <div className="section-label text-white/70">
                    Manager Review
                  </div>
                  <p className="mt-3 text-base italic leading-relaxed text-slack-text">
                    &ldquo;{personalizedManagerReview}&rdquo;
                  </p>
                  <p className="mt-3 text-sm text-slack-text-secondary">— {managerName}</p>
                </div>

                <div className="panel content-measure">
                  <div className="flex items-center justify-between gap-4">
                    <div className="section-label text-white/70">
                      Peer Feedback Excerpts
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slack-text-secondary">
                      {visibleFeedback.length} total
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {visibleFeedback.length > 0 ? (
                      visibleFeedback.map((feedback, index) => (
                        <div
                          key={`${feedback.stakeholderId}-${index}`}
                          className="rounded-xl border border-white/8 bg-[#15181d] px-4 py-4"
                        >
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slack-text-secondary">
                            Excerpt {String(index + 1).padStart(2, '0')}
                          </div>
                          <p className="mt-2 text-sm italic leading-6 text-slack-text">
                            &ldquo;{feedback.feedback}&rdquo;
                          </p>
                          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slack-text-secondary">
                            — Redacted in calibration packet
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-base italic leading-relaxed text-slack-text">
                        &ldquo;No feedback collected.&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="max-w-md text-sm text-slack-text-secondary">
            Your next review is already being discussed in a room you are not invited to.
          </p>

          <button
            onClick={onPlayAgain}
            className="rounded-2xl border border-slack-red px-8 py-3 text-lg font-black uppercase tracking-[0.16em] text-slack-red transition-colors hover:bg-slack-red/10 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
