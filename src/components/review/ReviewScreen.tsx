'use client';

import { RatingEngine } from '@/engine/RatingEngine';
import type { RatingResult, Stakeholder, CalibrationBucket } from '@/engine/types';

interface ReviewScreenProps {
  result: RatingResult;
  stakeholders: Stakeholder[];
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

export function ReviewScreen({ result, stakeholders, onPlayAgain }: ReviewScreenProps) {
  const archetypeInfo = RatingEngine.ARCHETYPE_LABELS[result.archetype];
  const stakeholderMap = new Map(stakeholders.map((s) => [s.id, s]));
  const convictionInfo = getConvictionLabel(result.conviction.score);
  const calibration = parseCalibrationOutcome(result.calibrationOutcome);

  const managerStakeholder = stakeholders.find((s) => s.id === 'the-manager');
  const managerName = managerStakeholder?.name || 'Your Manager';

  const firstFeedback = result.peerFeedback[0];

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
      {/* Header bar */}
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

      <div className="max-w-4xl mx-auto p-6">
        {/* Main grid: Rating+Archetype | Variables+Conviction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Left column: Rating + Archetype */}
          <div className="bg-[#1a1e24] rounded-lg p-6 border border-white/10">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">{BUCKET_EMOJI[result.calibrationBucket]}</span>
              <div>
                <div className="text-xs text-slack-text-secondary uppercase tracking-wider">Rating:</div>
                <div className="text-xl font-black text-white uppercase tracking-wide leading-tight">
                  {BUCKET_LABELS[result.calibrationBucket]}
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="text-xs text-slack-text-secondary uppercase tracking-wider mb-1">Archetype:</div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-black text-white uppercase tracking-wide">
                  {archetypeInfo.name}
                </div>
                <span className="text-2xl">🔧</span>
              </div>
              <div className="text-sm text-slack-text-secondary mt-2 italic">
                {archetypeInfo.description}
              </div>
            </div>
          </div>

          {/* Right column: Variables + Conviction */}
          <div className="space-y-4">
            <div className="bg-[#1a1e24] rounded-lg p-5 border border-white/10">
              {variables.map((v) => {
                const qual = getQualitativeLabel(v.value, v.inverted);
                return (
                  <div key={v.label} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slack-text-secondary">{v.label}: {v.value}%</span>
                      <span className="text-white tabular-nums font-bold">{v.value}%</span>
                    </div>
                    <div className="h-2 bg-[#2a2e34] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slack-link rounded-full transition-all duration-700"
                        style={{ width: `${v.value}%` }}
                      />
                    </div>
                    <div className={`text-[10px] text-right mt-0.5 uppercase tracking-wider font-semibold ${qual.color}`}>
                      {qual.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conviction Score */}
            <div className="bg-[#1a1e24] rounded-lg p-4 border border-white/10">
              <div className="text-xs text-slack-text-secondary uppercase tracking-wider font-semibold mb-2 border border-slack-text-secondary/30 rounded px-2 py-0.5 inline-block">
                Conviction Score
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">{convictionInfo.rating}</span>
                <span className="text-sm text-slack-text-secondary">{convictionInfo.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Manager Review */}
          <div className="relative bg-[#1a1e24] rounded-lg p-5 border border-white/10">
            <div className="text-xs text-white uppercase tracking-wider font-bold mb-3">
              Manager Review
            </div>
            <div className="bg-[#222830] rounded-lg p-4 relative">
              <p className="text-sm text-slack-text italic leading-relaxed">
                &ldquo;{result.managerReview.substring(0, 120)}...&rdquo;
              </p>
              <p className="text-xs text-slack-text-secondary mt-2">— {managerName}</p>
              <div className="absolute -bottom-2 left-6 w-4 h-4 bg-[#222830] rotate-45" />
            </div>
          </div>

          {/* Peer Feedback */}
          <div className="relative bg-[#1a1e24] rounded-lg p-5 border border-white/10">
            <div className="text-xs text-white uppercase tracking-wider font-bold mb-3">
              Anonymous Peer Feedback
            </div>
            <div className="bg-[#222830] rounded-lg p-4 relative">
              <p className="text-sm text-slack-text italic leading-relaxed">
                &ldquo;{firstFeedback?.feedback || 'No feedback collected.'}&rdquo;
              </p>
              <p className="text-xs text-slack-text-secondary mt-2">— [Redacted]</p>
              <div className="absolute -bottom-2 left-6 w-4 h-4 bg-[#222830] rotate-45" />
            </div>
          </div>
        </div>

        {/* Calibration Outcome */}
        <div className="border-2 border-slack-red/60 rounded-lg p-5 mb-6 bg-[#1a1e24]">
          <div className="inline-block bg-[#0d0f11] px-3 py-0.5 rounded text-xs text-slack-red uppercase tracking-wider font-bold -mt-8 mb-3 border border-slack-red/40">
            Calibration Outcome
          </div>
          <div className="space-y-1 text-sm font-mono">
            <div className="text-white">COMPENSATION: {calibration.comp}</div>
            <div className="text-white">PROMOTION STATUS: {calibration.promotion}</div>
          </div>
        </div>

        {/* Try Again */}
        <div className="text-center">
          <button
            onClick={onPlayAgain}
            className="px-12 py-4 border-2 border-slack-red text-slack-red font-black text-xl uppercase tracking-wider
              rounded-lg hover:bg-slack-red/10 transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <div className="text-slack-text-secondary text-sm mt-3">
            Your next review is scheduled.
          </div>
        </div>
      </div>
    </div>
  );
}
