'use client';

import { RatingEngine } from '@/engine/RatingEngine';
import type { RatingResult, Stakeholder } from '@/engine/types';

interface ReviewScreenProps {
  result: RatingResult;
  stakeholders: Stakeholder[];
  onPlayAgain: () => void;
}

const BUCKET_LABELS: Record<string, string> = {
  needs_improvement: 'Needs Improvement',
  partially_meets: 'Partially Meets Expectations',
  meets_expectations: 'Meets Expectations',
  exceeds_expectations: 'Exceeds Expectations',
  strongly_exceeds: 'Strongly Exceeds',
};

const BUCKET_COLORS: Record<string, string> = {
  needs_improvement: 'text-slack-red',
  partially_meets: 'text-slack-yellow',
  meets_expectations: 'text-slack-text',
  exceeds_expectations: 'text-slack-green',
  strongly_exceeds: 'text-slack-link',
};

export function ReviewScreen({ result, stakeholders, onPlayAgain }: ReviewScreenProps) {
  const archetypeInfo = RatingEngine.ARCHETYPE_LABELS[result.archetype];
  const stakeholderMap = new Map(stakeholders.map((s) => [s.id, s]));

  return (
    <div className="h-screen w-screen bg-slack-bg overflow-y-auto">
      <div className="max-w-2xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-sm text-slack-text-secondary uppercase tracking-wider mb-2">
            Performance Review — Q4
          </div>
          <h1 className="text-3xl font-bold text-slack-white mb-1">
            {BUCKET_LABELS[result.calibrationBucket]}
          </h1>
          <div className={`text-lg ${BUCKET_COLORS[result.calibrationBucket]}`}>
            Composite Score: {result.compositeScore.toFixed(1)}
          </div>
        </div>

        {/* Archetype */}
        <div className="bg-slack-channel-bg rounded-lg p-6 border border-slack-divider mb-6">
          <div className="text-slack-text-secondary text-xs uppercase tracking-wider mb-2">
            Your Archetype
          </div>
          <div className="text-2xl font-bold text-slack-white mb-1">
            {archetypeInfo.name}
          </div>
          <div className="text-slack-text">
            {archetypeInfo.description}
          </div>
        </div>

        {/* Variable Breakdown */}
        <div className="bg-slack-channel-bg rounded-lg p-6 border border-slack-divider mb-6">
          <div className="text-slack-text-secondary text-xs uppercase tracking-wider mb-4">
            Performance Dimensions
          </div>
          <div className="space-y-3">
            <VariableBar label="Exec Trust" value={result.variables.execTrust} />
            <VariableBar label="Communication" value={result.variables.communicationEffectiveness} />
            <VariableBar label="Team Morale" value={result.variables.teamMorale} />
            <VariableBar label="Product Judgment" value={result.variables.productJudgment} />
            <VariableBar label="Tech Debt" value={result.variables.techDebt} inverted />
            <VariableBar label="Responsiveness Debt" value={result.variables.responsivenessDebt} inverted />
          </div>
        </div>

        {/* Conviction */}
        <div className="bg-slack-channel-bg rounded-lg p-6 border border-slack-divider mb-6">
          <div className="text-slack-text-secondary text-xs uppercase tracking-wider mb-2">
            Conviction Assessment
          </div>
          <div className="flex gap-6">
            <div>
              <div className="text-2xl font-bold text-slack-white">
                {(result.conviction.score * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slack-text-secondary">Conviction Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slack-yellow">
                {result.conviction.deferCount}
              </div>
              <div className="text-xs text-slack-text-secondary">Deferred</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slack-red">
                {result.conviction.contradictionCount}
              </div>
              <div className="text-xs text-slack-text-secondary">Contradictions</div>
            </div>
          </div>
        </div>

        {/* Manager Review */}
        <div className="bg-slack-channel-bg rounded-lg p-6 border border-slack-divider mb-6">
          <div className="text-slack-text-secondary text-xs uppercase tracking-wider mb-2">
            Manager Review
          </div>
          <div className="text-slack-text italic leading-relaxed">
            &ldquo;{result.managerReview}&rdquo;
          </div>
        </div>

        {/* Peer Feedback */}
        {result.peerFeedback.length > 0 && (
          <div className="bg-slack-channel-bg rounded-lg p-6 border border-slack-divider mb-6">
            <div className="text-slack-text-secondary text-xs uppercase tracking-wider mb-4">
              Peer Feedback (Anonymous)
            </div>
            <div className="space-y-3">
              {result.peerFeedback.map((fb) => {
                const stakeholder = stakeholderMap.get(fb.stakeholderId);
                return (
                  <div key={fb.stakeholderId} className="border-l-2 border-slack-divider pl-3">
                    <div className="text-xs text-slack-text-secondary mb-0.5">
                      {stakeholder?.role || fb.stakeholderId}
                    </div>
                    <div className="text-slack-text text-sm">
                      &ldquo;{fb.feedback}&rdquo;
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calibration Outcome */}
        <div className="bg-slack-channel-bg rounded-lg p-6 border border-slack-divider mb-8">
          <div className="text-slack-text-secondary text-xs uppercase tracking-wider mb-2">
            Calibration Outcome
          </div>
          <div className="text-slack-text">
            {result.calibrationOutcome}
          </div>
        </div>

        {/* Play Again */}
        <div className="text-center">
          <button
            onClick={onPlayAgain}
            className="px-8 py-3 bg-slack-sidebar-active text-white font-bold rounded-lg
              hover:bg-slack-sidebar-active/80 transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <div className="text-slack-text-secondary text-xs mt-3">
            Different names. Same corporate entropy.
          </div>
        </div>
      </div>
    </div>
  );
}

function VariableBar({
  label,
  value,
  inverted = false,
}: {
  label: string;
  value: number;
  inverted?: boolean;
}) {
  const displayValue = inverted ? 100 - value : value;
  const color =
    displayValue >= 60
      ? 'bg-slack-green'
      : displayValue >= 40
        ? 'bg-slack-yellow'
        : 'bg-slack-red';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slack-text-muted">
          {label}
          {inverted && <span className="text-xs text-slack-text-secondary ml-1">(lower is better)</span>}
        </span>
        <span className="text-slack-white tabular-nums">{value}</span>
      </div>
      <div className="h-2 bg-slack-divider rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
