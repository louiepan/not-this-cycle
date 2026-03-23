import {
  type GameState,
  type GameVariables,
  type VariableName,
  type CalibrationBucket,
  type Archetype,
  type ConvictionResult,
  type RatingResult,
  type ResolvedDecision,
  SCORE_WEIGHTS,
} from './types';

export class RatingEngine {
  computeRating(state: GameState): RatingResult {
    const baseScore = this.computeCompositeScore(state.variables);
    const behaviorAdjustment = this.computeBehaviorAdjustment(state.resolvedDecisions);
    const compositeScore = Math.max(
      0,
      Math.min(100, Math.round((baseScore + behaviorAdjustment) * 100) / 100)
    );
    const calibrationBucket = this.getBucket(compositeScore);
    const conviction = this.computeConviction(state.resolvedDecisions);
    const archetype = this.detectArchetype(state.variables, conviction);
    const managerReview = this.generateManagerReview(calibrationBucket);
    const calibrationOutcome = this.generateCalibrationOutcome(calibrationBucket);

    return {
      compositeScore,
      variables: { ...state.variables },
      calibrationBucket,
      archetype,
      conviction,
      managerReview,
      peerFeedback: [], // populated by scenario-specific content
      calibrationOutcome,
    };
  }

  computeCompositeScore(variables: GameVariables): number {
    let score = 0;
    for (const [variable, config] of Object.entries(SCORE_WEIGHTS)) {
      const value = variables[variable as VariableName];
      const effective = config.invert ? 100 - value : value;
      score += effective * config.weight;
    }
    return Math.round(score * 100) / 100;
  }

  getBucket(score: number): CalibrationBucket {
    if (score <= 40) return 'needs_improvement';
    if (score <= 60) return 'partially_meets';
    if (score <= 74) return 'meets_expectations';
    if (score <= 88) return 'exceeds_expectations';
    return 'strongly_exceeds';
  }

  computeConviction(decisions: ResolvedDecision[]): ConvictionResult {
    const deferCount = decisions.filter((d) => d.wasDefer).length;
    const contradictionCount = decisions.filter(
      (d) => d.contradicts !== null
    ).length;

    const score = Math.max(
      0,
      1.0 - 0.14 * deferCount - 0.2 * contradictionCount
    );

    return { score, deferCount, contradictionCount };
  }

  computeBehaviorAdjustment(decisions: ResolvedDecision[]): number {
    let adjustment = 0;

    for (const decision of decisions) {
      if (decision.wasDefer) adjustment -= 2.5;
      if (decision.contradicts) adjustment -= 3.5;

      const tags = new Set(decision.tags);
      if (
        tags.has('overpromised') ||
        tags.has('optimistic-dates') ||
        tags.has('said-nothing') ||
        tags.has('performative') ||
        tags.has('vague-response') ||
        tags.has('dodged-dates')
      ) {
        adjustment -= 1.5;
      }

      const namedOwner = (decision.addressedStakeholderIds?.length || 0) > 0;
      const showedOwnership = decision.replySignals?.includes('ownership');
      if (namedOwner && showedOwnership) adjustment += 1.25;
    }

    return Math.max(-14, Math.min(4, adjustment));
  }

  detectArchetype(
    variables: GameVariables,
    conviction: ConvictionResult
  ): Archetype {
    const {
      execTrust,
      teamMorale,
      communicationEffectiveness,
      productJudgment,
      techDebt,
      responsivenessDebt,
    } = variables;

    // The Ghost: high responsiveness debt
    if (responsivenessDebt >= 60) return 'the_ghost';

    // The Politician: high exec trust, low team morale
    if (execTrust >= 70 && teamMorale <= 35) return 'the_politician';

    // The Engineer's PM: high team morale, low exec trust
    if (teamMorale >= 70 && execTrust <= 35) return 'the_engineers_pm';

    // The Cassandra: high product judgment, low exec trust
    if (productJudgment >= 70 && execTrust <= 40) return 'the_cassandra';

    // The Bulldozer: high conviction, low product judgment
    if (conviction.score >= 0.8 && productJudgment <= 35) return 'the_bulldozer';

    // The Diplomat: high comm effectiveness, high exec trust, high tech debt
    if (
      communicationEffectiveness >= 65 &&
      execTrust >= 60 &&
      techDebt >= 60
    )
      return 'the_diplomat';

    // The People Pleaser: high responsiveness (low debt) but many contradictions
    if (responsivenessDebt <= 15 && conviction.contradictionCount >= 3)
      return 'the_people_pleaser';

    // The Unicorn: everything balanced and good
    if (
      execTrust >= 55 &&
      teamMorale >= 55 &&
      communicationEffectiveness >= 55 &&
      productJudgment >= 55 &&
      techDebt <= 45 &&
      responsivenessDebt <= 20
    )
      return 'the_unicorn';

    // Fallback
    return 'the_survivor';
  }

  generateManagerReview(bucket: CalibrationBucket): string {
    const reviews: Record<CalibrationBucket, string> = {
      needs_improvement:
        '[Player] showed effort during a challenging planning cycle, but the quarter surfaced multiple gaps in judgment, clarity, and stakeholder management. In particular, there were several moments where the organization needed conviction and instead received delay, drift, or incomplete alignment. We will be formalizing a tighter development plan for next quarter. I continue to believe [Player] can grow here with the right support and a substantially stronger operating cadence.',
      partially_meets:
        '[Player] contributed meaningfully during Q4 planning, though their impact was inconsistent across stakeholders and moments of ambiguity. I would like to see stronger decision quality, clearer prioritization language, and more visible ownership when the room gets uncomfortable. There is a path here, but it will require a more durable point of view than we saw this quarter. Promotion readiness: not in this cycle.',
      meets_expectations:
        '[Player] delivered a generally solid quarter in a noisy environment. Stakeholders saw enough structure and follow-through to maintain confidence, though there is still room to sharpen executive communication and make tradeoffs feel more intentional. I would like to see [Player] operate with greater consistency across audiences before we discuss expanded scope. Overall: tracking in the right direction, with clear growth areas still visible.',
      exceeds_expectations:
        '[Player] had a strong quarter relative to the operating conditions. Cross-functional partners consistently experienced [Player] as composed, credible, and directionally useful during ambiguity. That said, we are not at a point where I want to create expectations around level movement; the next level remains highly selective and the bar there is meaningfully higher than strong execution in a difficult cycle. My guidance is to keep compounding this level of performance and revisit later.',
      strongly_exceeds:
        '[Player] was one of the stronger operators in a messy quarter and built unusual confidence across multiple stakeholders. Their communication style, prioritization instincts, and visible ownership all stand out positively. Even so, promotion remains a separate calibration conversation with limited headcount and unusually high scrutiny this half, so I do not want to over-interpret one strong cycle. The signal is encouraging; the answer is still not this cycle.',
    };
    return reviews[bucket];
  }

  generateCalibrationOutcome(bucket: CalibrationBucket): string {
    const outcomes: Record<CalibrationBucket, string> = {
      needs_improvement:
        'Performance improvement plan initiated. Promotion timeline: not applicable at this time.',
      partially_meets:
        'Comp adjustment: 2.1% (cost of living). Promotion timeline: your manager would like to see more consistent execution before having that conversation.',
      meets_expectations:
        'Comp adjustment: 3.2%. Promotion timeline: your manager believes you are building useful skills, but the org is prioritizing sustained signal over isolated strong moments. Let\'s revisit later.',
      exceeds_expectations:
        'Comp adjustment: 6.4%. Your manager sees positive momentum, though there is not enough calibration support to turn that into a promotion conversation right now. Headcount remains constrained and the expectation is additional proof over time.',
      strongly_exceeds:
        'Comp adjustment: 8.1%. Your manager is advocating strongly, but current headcount, calibration compression, and cross-org leveling discipline mean the outcome is still no promotion this cycle. Please interpret this as encouragement, not a promise.',
    };
    return outcomes[bucket];
  }

  static readonly ARCHETYPE_LABELS: Record<Archetype, { name: string; description: string }> = {
    the_people_pleaser: {
      name: 'The People Pleaser',
      description: 'Said yes to everything, contradicted yourself across stakeholders.',
    },
    the_politician: {
      name: 'The Politician',
      description: 'Played up, not down. Leadership loves you. Your team does not.',
    },
    the_engineers_pm: {
      name: "The Engineer's PM",
      description: 'Protected the team but lost the room.',
    },
    the_ghost: {
      name: 'The Ghost',
      description: "Just... didn't answer.",
    },
    the_diplomat: {
      name: 'The Diplomat',
      description: "Said all the right things but made promises the codebase can't keep.",
    },
    the_cassandra: {
      name: 'The Cassandra',
      description: 'Was right about everything. Nobody listened.',
    },
    the_bulldozer: {
      name: 'The Bulldozer',
      description: 'Wrong about everything, drove it through anyway — and somehow the exec loves you.',
    },
    the_unicorn: {
      name: 'The Unicorn',
      description: 'Balanced everything. Extremely rare.',
    },
    the_survivor: {
      name: 'The Survivor',
      description: 'Made it through without a clear pattern. Honestly the most realistic outcome.',
    },
  };
}
