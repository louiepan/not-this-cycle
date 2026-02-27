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
    const compositeScore = this.computeCompositeScore(state.variables);
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
    if (score <= 25) return 'needs_improvement';
    if (score <= 45) return 'partially_meets';
    if (score <= 65) return 'meets_expectations';
    if (score <= 80) return 'exceeds_expectations';
    return 'strongly_exceeds';
  }

  computeConviction(decisions: ResolvedDecision[]): ConvictionResult {
    const deferCount = decisions.filter((d) => d.wasDefer).length;
    const contradictionCount = decisions.filter(
      (d) => d.contradicts !== null
    ).length;

    const score = Math.max(
      0,
      1.0 - 0.1 * deferCount - 0.15 * contradictionCount
    );

    return { score, deferCount, contradictionCount };
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
        '[Player] has shown commitment to the role this quarter and I appreciate their effort during a challenging planning cycle. There are several areas where I\'d like to see more consistent execution, particularly around stakeholder communication and proactive alignment with leadership priorities. We\'ll be putting together a focused development plan for Q1 to help build stronger operating rhythms. I remain confident in [Player]\'s long-term potential at the company.',
      partially_meets:
        '[Player] made meaningful contributions during Q4 planning. There is an opportunity to build stronger trust with senior leadership through increased visibility and more proactive communication. I\'d also encourage [Player] to develop a stronger point of view on prioritization — the team would benefit from more decisive leadership on tradeoffs. Promotion readiness: not in this cycle, but I see a path forward.',
      meets_expectations:
        '[Player] delivered solid results this quarter. Stakeholder feedback has been generally positive, with some opportunities to strengthen executive communication. [Player] demonstrates a good understanding of the problem space and has built productive relationships across the team. For next half, I\'d like to see [Player] take on more ambiguous, high-impact work to demonstrate readiness for the next level. Overall: tracking well.',
      exceeds_expectations:
        '[Player] had a strong quarter. Cross-functional partners consistently highlighted [Player]\'s ability to navigate ambiguity and drive alignment. Leadership has taken note of [Player]\'s strategic instincts and communication skills. There are still growth areas — no one is done developing — but [Player] is demonstrating the competencies we look for at the next level. I\'m putting [Player] forward for promotion consideration in the next cycle.',
      strongly_exceeds:
        '[Player] delivered exceptional results this quarter, exceeding expectations across multiple dimensions. Cross-functional partners have consistently praised [Player]\'s ability to balance strategic vision with execution rigor. I am sponsoring [Player]\'s promotion case for this cycle.',
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
        'Comp adjustment: 3.5%. Promotion timeline: your manager believes you\'re building the right skills. Let\'s revisit in H2.',
      exceeds_expectations:
        'Comp adjustment: 8%. Your manager is planning to put your name forward for promotion next cycle. There\'s a lot of competition at the next level and headcount will depend on budget, but you\'re well-positioned.',
      strongly_exceeds:
        'Comp adjustment: 12%. Your manager is actively advocating for your promotion. Based on current level headcount availability and calibration outcomes across the org, there\'s a strong chance — though nothing is guaranteed until the committee meets.',
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
