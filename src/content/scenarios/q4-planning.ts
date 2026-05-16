import type { Scenario, StakeholderTemplate, GameEvent, ChannelDef, MessagePool } from '@/engine/types';

// ============================================================
// Stakeholder Templates
// ============================================================

const THE_VP: StakeholderTemplate = {
  id: 'the-vp',
  templateId: 'the-vp',
  role: 'VP of Product',
  seniority: 'vp',
  statusEmoji: '🎯',
  statusText: 'Q4 Planning',
  personality: {
    mbtiType: 'ENTJ',
    enneagramType: 3,
    enneagramWing: 4,
    stressDirection: 9,
    coreFear: 'Being seen as ineffective',
    coreDesire: 'Impact and recognition',
    communicationStyle: 'Terse, expects speed, drops names',
    voiceRegister:
      'Terse imperatives. Single-word sentences ("Good." "Fine."). Opens with what just happened in exec staff ("Just left staff,"). Never explains, never apologizes. Cuts off pleasantries. Uses "tight," "clean," "headline" as adjectives for deliverables.',
    voiceExamples: [
      'Just left staff. CEO wants something demo-able at the all-hands in 6 weeks.',
      'Keep the tradeoffs below the fold. I need the headline to read clean.',
      'Fine. Bring me a recommendation, not a seminar on complexity.',
    ],
    pushBackLines: [
      'Specifically?',
      'Pick a headline I can repeat.',
      'I need a direction, not a vibe.',
      'Try that again. Where are you actually landing?',
    ],
  },
  mechanics: {
    patience: 0.4,
    directness: 0.9,
    conflictStyle: 'confront',
    politicalAwareness: 0.95,
    escalationPattern: 'go-public',
  },
  namePool: [
    { firstName: 'Sarah', lastName: 'Chen' },
    { firstName: 'Marcus', lastName: 'Wright' },
    { firstName: 'Diana', lastName: 'Kovac' },
    { firstName: 'James', lastName: 'Okonkwo' },
    { firstName: 'Priya', lastName: 'Sharma' },
  ],
};

const THE_STAFF_ENG: StakeholderTemplate = {
  id: 'the-staff-eng',
  templateId: 'the-staff-eng',
  role: 'Staff Engineer',
  seniority: 'ic',
  statusEmoji: '🔧',
  statusText: 'In the codebase',
  personality: {
    mbtiType: 'INTJ',
    enneagramType: 5,
    enneagramWing: 6,
    stressDirection: 7,
    coreFear: 'Being forced to ship garbage',
    coreDesire: 'Technical excellence and autonomy',
    communicationStyle: 'Precise, unemotional, occasional dry wit',
    voiceRegister:
      'Talks in blast radius, weird deploys, P0 risk, blast surface. Professionally exhausted. Says "cursed" affectionately. Hedges on hope, never on engineering. Will write "I need a call" rather than "please decide." Long pauses between messages.',
    voiceExamples: [
      'Auth is one weird deploy away from eating logins. If we layer SSO on top right now, I think we create actual P0 risk.',
      'I\'ll build the least cursed version of it I can.',
      'I\'m treating the silence as "ship fast." Logging the debt for Q1 and moving on.',
    ],
    pushBackLines: [
      'Need a call, not a vibe.',
      'I can\'t write the doc with that. Yes or no?',
      'Give me something I can put in front of the team.',
      'I need to know which one we\'re actually committing to.',
    ],
  },
  mechanics: {
    patience: 0.7,
    directness: 0.85,
    conflictStyle: 'withdraw',
    politicalAwareness: 0.3,
    escalationPattern: 'go-silent',
  },
  namePool: [
    { firstName: 'Alex', lastName: 'Petrov' },
    { firstName: 'Jordan', lastName: 'Liu' },
    { firstName: 'Sam', lastName: 'Nakamura' },
    { firstName: 'Dev', lastName: 'Krishnan' },
    { firstName: 'Casey', lastName: 'Berg' },
  ],
};

const THE_DESIGN_LEAD: StakeholderTemplate = {
  id: 'the-design-lead',
  templateId: 'the-design-lead',
  role: 'Design Lead',
  seniority: 'ic',
  statusEmoji: '🎨',
  statusText: 'Figma',
  personality: {
    mbtiType: 'ENFP',
    enneagramType: 4,
    enneagramWing: 3,
    stressDirection: 2,
    coreFear: 'Shipping something ugly that hurts users',
    coreDesire: 'Creating beautiful, intuitive experiences',
    communicationStyle: 'Empathetic, uses metaphors, emotionally invested',
    voiceRegister:
      'Names the human cost of decisions ("users are going to feel the seams"). Polite but doesn\'t let you off the hook. Asks for compromises to be made public so design isn\'t carrying them alone later. Uses "we" generously but means it.',
    voiceExamples: [
      'SSO, dashboard, and onboarding revamp in one release is a lot of new mental models at once. Users are going to feel the seams.',
      'Okay. Then I want the compromise named somewhere public so design is not carrying it alone later.',
      'I just don\'t want us pretending the UX survives untouched.',
    ],
    pushBackLines: [
      'Help me out — what are we actually choosing between?',
      'Are we phasing this, or shipping all at once? Those are very different.',
      'I want to help you make this work. What\'s the actual ask?',
      'Be honest with me. What\'s the part you don\'t want to say out loud?',
    ],
  },
  mechanics: {
    patience: 0.6,
    directness: 0.5,
    conflictStyle: 'absorb',
    politicalAwareness: 0.4,
    escalationPattern: 'go-around',
  },
  namePool: [
    { firstName: 'Mia', lastName: 'Torres' },
    { firstName: 'Kai', lastName: 'Andersen' },
    { firstName: 'Riley', lastName: 'Park' },
    { firstName: 'Zara', lastName: 'Hassan' },
    { firstName: 'Jamie', lastName: 'Reeves' },
  ],
};

const THE_DATA_ANALYST: StakeholderTemplate = {
  id: 'the-data-analyst',
  templateId: 'the-data-analyst',
  role: 'Senior Data Analyst',
  seniority: 'ic',
  statusEmoji: '📊',
  statusText: 'Running queries',
  personality: {
    mbtiType: 'ISTJ',
    enneagramType: 6,
    enneagramWing: 5,
    stressDirection: 3,
    coreFear: 'Making decisions on bad data',
    coreDesire: 'Accuracy and being prepared',
    communicationStyle: 'Cautious, hedges, provides receipts',
    voiceRegister:
      'Hedges with numerical specificity ("closer to ~$200K than $2M"). Brings receipts unprompted. Self-deprecates to soften the blow ("awkward now," "mildly unpopular"). Frequently ends lines with "for whatever that is worth" or similar disclaimers. Quiet but lethal.',
    voiceExamples: [
      'I reran the SSO model. On current enterprise pipeline I\'m seeing closer to ~$200K ARR than the $2M number that made it to the board.',
      'Three enterprise prospects mentioned admin controls before they mentioned onboarding, for whatever that is worth.',
      'Mildly unpopular now is still better than spectacularly wrong later.',
    ],
    pushBackLines: [
      'To make sure I run the right query — what\'s the actual question?',
      'Hedging is fine, but I need a direction to pull data against.',
      'What outcome are you optimizing for? Different metrics for different answers.',
      'Specifically? I can be more useful with a sharper ask.',
    ],
  },
  mechanics: {
    patience: 0.8,
    directness: 0.4,
    conflictStyle: 'absorb',
    politicalAwareness: 0.5,
    escalationPattern: 'go-silent',
  },
  namePool: [
    { firstName: 'Taylor', lastName: 'Kim' },
    { firstName: 'Morgan', lastName: 'Patel' },
    { firstName: 'Robin', lastName: 'Zhao' },
    { firstName: 'Avery', lastName: 'Ogundimu' },
    { firstName: 'Quinn', lastName: 'Svensson' },
  ],
};

const THE_MANAGER: StakeholderTemplate = {
  id: 'the-manager',
  templateId: 'the-manager',
  role: 'Your Manager (Dir. of Product)',
  seniority: 'director',
  statusEmoji: '📅',
  statusText: 'Back-to-back',
  personality: {
    mbtiType: 'ESFJ',
    enneagramType: 9,
    enneagramWing: 1,
    stressDirection: 6,
    coreFear: 'Conflict and looking bad to their boss',
    coreDesire: 'Harmony and being seen as a good manager',
    communicationStyle: 'Overly positive, vague, avoids specifics',
    voiceRegister:
      'Performative warmth ("Big day today!"). Mentions being in back-to-backs as a soft decline. Offers help in the abstract, never the specific. Never takes a position. Defers to "the team" or "leadership" when pressed. Uses exclamation marks at moments that don\'t earn them.',
    voiceExamples: [
      'Good morning! Big day today. Let me know if you need anything — I\'m in back-to-backs but can make time.',
      'Heads up: {{the-vp.firstName}} was not thrilled that the revenue numbers hit #planning-war-room. Not saying you were wrong. Just saying visibility has a half-life around here.',
      'Today\'s going to be... a day.',
    ],
    pushBackLines: [
      'Help me help you — what specifically?',
      'Walk me through it. I want to make sure I\'m representing you correctly upstairs.',
      'I\'m all ears! Just want to make sure I understand the actual move.',
      'Where are you leaning? I can help you sharpen it.',
    ],
  },
  mechanics: {
    patience: 0.9,
    directness: 0.2,
    conflictStyle: 'absorb',
    politicalAwareness: 0.7,
    escalationPattern: 'go-around',
  },
  namePool: [
    { firstName: 'Chris', lastName: 'Donovan' },
    { firstName: 'Pat', lastName: 'Morales' },
    { firstName: 'Lee', lastName: 'Tanaka' },
    { firstName: 'Dana', lastName: 'Sullivan' },
    { firstName: 'Noel', lastName: 'Baptiste' },
  ],
};

const THE_TPM: StakeholderTemplate = {
  id: 'the-tpm',
  templateId: 'the-tpm',
  role: 'Technical Program Manager',
  seniority: 'ic',
  statusEmoji: '📋',
  statusText: 'Updating the tracker',
  personality: {
    mbtiType: 'ESTJ',
    enneagramType: 1,
    enneagramWing: 2,
    stressDirection: 4,
    coreFear: 'Chaos and missed deadlines',
    coreDesire: 'Order, accountability, clean trackers',
    communicationStyle: 'Structured, bullet points, asks for dates',
    voiceRegister:
      'Bullets and dates. Past-tense passive aggression ("your row says TBD in red"). Tracks who said what, when. Never forgets a slip. Will quote your earlier message back at you. Reads "TBD" as a personal failure.',
    voiceExamples: [
      '@you — can I get:\n• SSO target\n• Dashboard v2 target\n• Onboarding revamp target\n• Known blockers / dependencies',
      'Still need those dates. Deck review is tomorrow and I am not putting TBD in front of execs.',
      'Helpful. Messy, but helpful. I can work with conditional dates as long as nobody edits the nuance out of the slide later.',
    ],
    pushBackLines: [
      'I need something I can put in the tracker. Date or no date.',
      'Sharper, please. The row needs a value, not a vibe.',
      'Translation for the tracker: what\'s the actual call?',
      'Either / or, not both. Which row goes red if we don\'t decide?',
    ],
  },
  mechanics: {
    patience: 0.3,
    directness: 0.8,
    conflictStyle: 'confront',
    politicalAwareness: 0.6,
    escalationPattern: 'go-public',
  },
  namePool: [
    { firstName: 'Sanjay', lastName: 'Mehta' },
    { firstName: 'Elena', lastName: 'Volkov' },
    { firstName: 'Derek', lastName: 'Chang' },
    { firstName: 'Nicole', lastName: 'Abrams' },
    { firstName: 'Omar', lastName: 'Farouk' },
  ],
};

const THE_ADJACENT_PM: StakeholderTemplate = {
  id: 'the-adjacent-pm',
  templateId: 'the-adjacent-pm',
  role: 'PM, Platform Team',
  seniority: 'ic',
  statusEmoji: '🚀',
  statusText: 'Crushing it',
  personality: {
    mbtiType: 'ENTP',
    enneagramType: 3,
    enneagramWing: 2,
    stressDirection: 9,
    coreFear: 'Being overlooked',
    coreDesire: 'Being the favorite, being promoted first',
    communicationStyle: 'Casually drops exec names, volunteers to "help", subtle credit-taking',
    voiceRegister:
      'Opens with which executive she just spoke to. Volunteers to "help" or "take something off your plate" — translation: scope grab. Uses "we" to mean "me + the person you report to." Liberal emoji (🙌 ✨ 💪). Always cc-ing one more person than you expected.',
    voiceExamples: [
      'Hey! {{the-vp.firstName}} mentioned we should sync on Q4. I\'ve been chatting with {{the-vp.firstName}} about how platform can support the initiative — happy to take the API integration piece off your plate if that helps? 🙌',
      'Looping {{the-vp.firstName}} for visibility ✨',
      'No worries if you\'re slammed! I can just run with it and share back when it\'s ready 💪',
    ],
    pushBackLines: [
      'Just so I\'m sure I\'m tracking — what\'s the move? 🙌',
      'Want to make sure I rep this correctly to {{the-vp.firstName}}. What direction are we landing on?',
      'No pressure at all! Just need a sentence I can drop in the next sync ✨',
      'Quick clarifier — are we coordinating on this or are you taking point?',
    ],
  },
  mechanics: {
    patience: 0.6,
    directness: 0.6,
    conflictStyle: 'triangulate',
    politicalAwareness: 0.95,
    escalationPattern: 'go-around',
  },
  namePool: [
    { firstName: 'Blake', lastName: 'Morrison' },
    { firstName: 'Reese', lastName: 'Whitfield' },
    { firstName: 'Skyler', lastName: 'Huang' },
    { firstName: 'Kendall', lastName: 'Osei' },
    { firstName: 'Emery', lastName: 'Larsson' },
  ],
};

// ============================================================
// Channels
// ============================================================

const CHANNELS: ChannelDef[] = [
  { id: 'product-strategy', name: 'q4-planning', type: 'channel', description: 'Cross-functional alignment for Q4 priorities' },
  { id: 'eng-team', name: 'eng-platform', type: 'channel', description: 'Platform engineering updates' },
  { id: 'design-sync', name: 'design-review', type: 'channel', description: 'Design crit and shipping decisions' },
  { id: 'planning-war-room', name: 'product-leadership', type: 'channel', description: 'PM org alignment' },
  { id: 'support-escalations', name: 'incidents-prod', type: 'channel', description: 'Production incidents and live triage', isNoise: true },
  { id: 'customer-feedback', name: 'growth-pod', type: 'channel', description: 'Growth-org standup and posts', isNoise: true },
  { id: 'gtm-launches', name: 'retention-wg', type: 'channel', description: 'Retention working group', isNoise: true },
  { id: 'sales-questions', name: 'general', type: 'channel', description: 'Company-wide chat', isNoise: true },
  { id: 'support-triage', name: 'announcements', type: 'channel', description: 'Company-wide announcements', isNoise: true },
  { id: 'platform-ops', name: 'data-insights', type: 'channel', description: 'Data and insights digest', isNoise: true },
  { id: 'growth-ideas', name: 'field-asks', type: 'channel', description: 'Urgent requests that are somehow all strategic', isNoise: true },
  { id: 'board-prep', name: 'board-prep', type: 'channel', description: 'Narrative cleanup and exec polish', isNoise: true },
  { id: 'roadmap-backlog', name: 'roadmap-backlog', type: 'channel', description: 'Things that will definitely be revisited later', isNoise: true },
  { id: 'compliance-fire-drill', name: 'compliance-wg', type: 'channel', description: 'Important until someone else owns it', isNoise: true },
  { id: 'team-random', name: 'team-random', type: 'channel', description: 'Low-stakes bonding and calendar entropy', isNoise: true },
  { id: 'field-asks', name: 'gtm-launches', type: 'channel', description: 'Launch comms and enablement requests', isNoise: true },
  { id: 'dm-manager', name: '{{the-manager.firstName}} {{the-manager.lastName}}', type: 'dm' },
  { id: 'dm-vp', name: '{{the-vp.firstName}} {{the-vp.lastName}}', type: 'dm' },
  { id: 'dm-staff-eng', name: '{{the-staff-eng.firstName}} {{the-staff-eng.lastName}}', type: 'dm' },
  { id: 'dm-design-lead', name: '{{the-design-lead.firstName}} {{the-design-lead.lastName}}', type: 'dm' },
];

// ============================================================
// Game Events
// ============================================================

const EVENTS: GameEvent[] = [
  // ---- Warm-start: pre-existing channel history ----

  // Context already in product-strategy when you arrive (chronological — oldest to newest)
  {
    id: 'evt-history-product',
    triggerAt: 0,
    channel: 'product-strategy',
    messages: [
      {
        id: 'msg-history-kickoff',
        from: 'the-manager',
        content: 'Heads up team — Q4 planning kicks off today. {{the-vp.firstName}} wants a roadmap locked by end of week. Let\'s stay aligned.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-history-ack-design',
        from: 'the-design-lead',
        content: 'Sounds good. I\'ll have the updated mocks ready for review this afternoon.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-history-flag-eng',
        from: 'the-staff-eng',
        content: 'Just flagging — there are some tech debt items we should discuss before locking scope.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-history-priorities',
        from: 'the-manager',
        content: 'Reposting the Q4 priorities per {{the-vp.firstName}}\'s ask since the kickoff thread got noisy. Three things the board is watching: enterprise readiness for the upmarket motion, the AI feature we keep slipping, and the readiness story we are not officially calling IPO prep. {{world.teamName}} touches all three. Scoping convos kick off this week.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-history-tracker',
        from: 'the-tpm',
        content: 'Q4 tracker is live. Dates start filling in this week. Don\'t be the row that goes red.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-history-scope',
        from: 'the-tpm',
        content: 'Current rows under discussion for {{world.teamName}}:\n• SSO + admin console (enterprise lane)\n• Onboarding v2 (activation funnel)\n• Dashboard v2 with the AI surface\n• Integrations refresh\nScoping this week. Owners TBD until {{the-vp.firstName}} signs off.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
    ],
    priority: 'ambient',
  },

  // Manager DM — morning greeting, then welcome aside, then re-grounding, then pinned pointer.
  // ORDER IS LOAD-BEARING: greeting -> welcome -> re-grounding -> pinned references.
  // Delays stagger the messages over ~6s so the manager's morning DM trickles in
  // rather than landing as a wall of text.
  // The "Heads up: {VP} was not thrilled" beat (evt-vp-data-reaction) must NEVER appear
  // in this event — it only fires after the player surfaces revenue data. Eval enforces this.
  {
    id: 'evt-history-dm-manager',
    triggerAt: 0,
    channel: 'dm-manager',
    messages: [
      {
        id: 'msg-dm-mgr-morning',
        from: 'the-manager',
        content: 'Big day today. Let me know if you need anything — I\'m in back-to-backs but can make time.',
        delay: 0,
        mentionsPlayer: true,
        contextValue: 'ambient',
      },
      {
        id: 'msg-dm-mgr-welcome',
        from: 'the-manager',
        content: 'And welcome aboard, formally. I know you\'ve been onboarding but today is where it gets real.',
        delay: 2500,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-dm-mgr-regrounding',
        from: 'the-manager',
        content: 'Quick re-grounding before you jump in: the mandate {{the-vp.firstName}} gave me for {{world.teamName}} this quarter is "unblock the Q4 roadmap." Translation: something demo-able at the all-hands in 6 weeks, without breaking what already works. You\'ve got more latitude than your predecessor had — use it.',
        delay: 4000,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-dm-mgr-pinned',
        from: 'the-manager',
        content: 'I pinned the Q4 priorities recap at the top of #q4-planning this morning — read that first. The tracker {{the-tpm.firstName}} runs is linked in there too.',
        delay: 6000,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
    ],
    priority: 'ambient',
  },

  // VP welcome DM — fires a few seconds in. Low-value introduction, no ask.
  // Sets up the relationship without creating action. Player notices the DM
  // light up second (after the manager DM that's already there at t=0).
  {
    id: 'evt-history-dm-vp-welcome',
    triggerAt: 3000,
    channel: 'dm-vp',
    messages: [
      {
        id: 'msg-dm-vp-welcome',
        from: 'the-vp',
        content: 'Welcome aboard. Looking forward to seeing what {{world.teamName}} ships this quarter.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
    ],
    priority: 'ambient',
  },

  // Staff Eng DM — brief pleasantry, then the ask. Fires ~8s in so the
  // manager + VP messages land first and the player can orient.
  {
    id: 'evt-history-dm-eng',
    triggerAt: 8000,
    channel: 'dm-staff-eng',
    messages: [
      {
        id: 'msg-dm-eng-pleasantry',
        from: 'the-staff-eng',
        content: 'Morning. Welcome aboard.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-dm-eng-ask',
        from: 'the-staff-eng',
        content: 'Hey — got a sec later today? Need to talk about the auth service before we commit to anything for Q4.',
        delay: 0,
        mentionsPlayer: true,
        contextValue: 'ambient',
      },
    ],
    priority: 'ambient',
  },

  // Design Lead DM — warm welcome with an edge, then a 15-min ask. Fires
  // last (~14s in) so the player isn't drowning in pings at game start.
  {
    id: 'evt-history-dm-design',
    triggerAt: 14000,
    channel: 'dm-design-lead',
    messages: [
      {
        id: 'msg-dm-design-welcome',
        from: 'the-design-lead',
        content: 'Welcome! Genuinely glad you\'re here. Onboarding has needed a real PM for a while.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-dm-design-ask',
        from: 'the-design-lead',
        content: 'Whenever you\'ve digested the Q4 scope, would love 15 min on the onboarding piece. There\'s UX debt I\'d rather not bury in the slide deck if we\'re actually committing to a revamp this quarter.',
        delay: 0,
        mentionsPlayer: true,
        contextValue: 'ambient',
      },
    ],
    priority: 'ambient',
  },

  // Planning war room — warm-start scrollback so the channel isn't a ghost town
  // when the data analyst's revelation lands later in the game.
  {
    id: 'evt-history-planning-war-room',
    triggerAt: 0,
    channel: 'planning-war-room',
    messages: [
      {
        id: 'msg-planning-war-room-1',
        from: 'the-tpm',
        content: 'Sliding the cross-fn sync to 1pm so {{the-vp.firstName}} can sit in part of it.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-planning-war-room-2',
        from: 'the-design-lead',
        content: 'Works. I\'ll bring the seam analysis I owe you.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-planning-war-room-3',
        from: 'the-staff-eng',
        content: 'Joining late. Triage with the platform team runs until 1:15.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-planning-war-room-4',
        from: 'the-manager',
        content: 'Great! Make sure design + eng have time to actually disagree on something — we keep papering over the seams.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-planning-war-room-5',
        from: 'the-adjacent-pm',
        content: 'Looping {{the-vp.firstName}} on the platform overlap items so we don\'t end up re-explaining at the readout ✨',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
    ],
    priority: 'ambient',
  },

  // Slack clutter: channels that feel alive but are not part of the core game loop
  {
    id: 'evt-history-support-escalations',
    triggerAt: 0,
    channel: 'support-escalations',
    messages: [
      {
        id: 'msg-support-escalations-0a',
        from: 'the-tpm',
        content: 'Closing the loop on the Acme ticket from last week — they got their dates, we got our credibility back.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-support-escalations-0b',
        from: 'the-manager',
        content: 'Nice work navigating that. Acme is now a reference call we can actually use.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-support-escalations-0c',
        from: 'the-design-lead',
        content: 'And the original UX complaint? Filed under "we\'ll think about it."',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-support-escalations-1',
        from: 'the-manager',
        content: 'Acct team asking whether we can say SSO is "on track for Q4." Please remember customers hear confidence where we intended vibes.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-support-escalations-2',
        from: 'the-tpm',
        content: 'If we say anything, can someone please define whether "on track" means date-confidence or just spiritual alignment.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-support-escalations-3',
        from: 'the-adjacent-pm',
        content: 'Strong preference for language that survives screenshots.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
    priority: 'ambient',
  },
  {
    id: 'evt-history-customer-feedback',
    triggerAt: 0,
    channel: 'customer-feedback',
    messages: [
      {
        id: 'msg-customer-feedback-0a',
        from: 'the-adjacent-pm',
        content: 'Field pinged me — Acme wants "AI features but explainable." Logged.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-customer-feedback-0b',
        from: 'the-data-analyst',
        content: 'Could you ask what "explainable" specifically means to them? Logged is fine but I\'d like a paragraph.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-customer-feedback-0c',
        from: 'the-adjacent-pm',
        content: 'Will follow up. They were on speaker so the answer was loud confidence.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-customer-feedback-1',
        from: 'the-data-analyst',
        content: 'Three enterprise prospects mentioned admin controls before they mentioned onboarding, for whatever that is worth.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-customer-feedback-2',
        from: 'the-design-lead',
        content: 'That tracks. Onboarding gets a lot of airtime internally because we have to look at it all day.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-customer-feedback-3',
        from: 'the-vp',
        content: 'Useful. Let\'s make sure we do not accidentally build for the meeting instead of the market.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
    priority: 'ambient',
  },
  {
    id: 'evt-history-gtm-launches',
    triggerAt: 0,
    channel: 'gtm-launches',
    messages: [
      {
        id: 'msg-gtm-launches-0a',
        from: 'the-design-lead',
        content: 'Whatever it ends up being called, the marketing site needs the screenshots updated before the deck goes external.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-gtm-launches-0b',
        from: 'the-tpm',
        content: 'I need at least one ship date that survives contact with the website.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-gtm-launches-0c',
        from: 'the-adjacent-pm',
        content: 'Working on it ✨',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-gtm-launches-1',
        from: 'the-manager',
        content: 'Reminder that naming is still "placeholder naming" until legal says otherwise, which I assume they eventually will.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-gtm-launches-2',
        from: 'the-adjacent-pm',
        content: 'Marketing deck currently calls it "Enterprise Control Center" which feels both expensive and impossible.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-gtm-launches-3',
        from: 'the-manager',
        content: 'Please do not let Sales hear that phrase before we decide whether it exists.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
    priority: 'ambient',
  },
  {
    id: 'evt-history-sales-questions',
    triggerAt: 0,
    channel: 'sales-questions',
    messages: [
      {
        id: 'msg-sales-questions-0a',
        from: 'the-adjacent-pm',
        content: 'AE asked again about admin roles for Q4. Redirected to "enterprise readiness" which I think is the right altitude.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-sales-questions-0b',
        from: 'the-vp',
        content: 'Correct.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-sales-questions-0c',
        from: 'the-manager',
        content: 'Bookmarking "the right altitude" as a future framework.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-sales-questions-1',
        from: 'the-vp',
        content: 'If anyone is talking to Sales today, please avoid implying that the roadmap is a buffet.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-sales-questions-2',
        from: 'the-adjacent-pm',
        content: 'Counterpoint: Sales already ordered family-style.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-sales-questions-3',
        from: 'the-manager',
        content: 'Let\'s just keep the menu verbal until planning settles.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
    priority: 'ambient',
  },
  {
    id: 'evt-history-support-triage',
    triggerAt: 0,
    channel: 'support-triage',
    messages: [
      {
        id: 'msg-support-triage-0a',
        from: 'the-staff-eng',
        content: 'Closed out the deploy-train rollback retro. Action items survived the meeting, which is two more than usual.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-support-triage-0b',
        from: 'the-tpm',
        content: 'Will track them in the tracker.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-support-triage-0c',
        from: 'the-staff-eng',
        content: 'The tracker is haunted but yes.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-support-triage-1',
        from: 'the-staff-eng',
        content: 'The auth service has entered the part of its life cycle where every fix feels like a threat.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-support-triage-2',
        from: 'the-tpm',
        content: 'Copying that into the incident retro under "known emotional truths."',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-support-triage-3',
        from: 'the-staff-eng',
        content: 'Please don\'t. The doc has suffered enough.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
    priority: 'ambient',
  },
  {
    id: 'evt-history-platform-ops',
    triggerAt: 0,
    channel: 'platform-ops',
    messages: [
      {
        id: 'msg-platform-ops-0a',
        from: 'the-tpm',
        content: 'Quick reminder: q3 retros are due in the wiki under "rituals." If you wrote a postmortem you owe it a 2-line takeaway.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-platform-ops-0b',
        from: 'the-staff-eng',
        content: 'Rituals folder feels apt.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-platform-ops-0c',
        from: 'the-manager',
        content: 'Just be honest. Specific is better than diplomatic in retros.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-platform-ops-1',
        from: 'the-tpm',
        content: 'Please update owners in the dependency sheet. There are currently twelve rows assigned to "TBD".',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-platform-ops-2',
        from: 'the-manager',
        content: 'That number feels spiritually accurate for this week.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-platform-ops-3',
        from: 'the-tpm',
        content: 'I am once again asking everyone to distinguish uncertainty from absence of ownership.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
    priority: 'ambient',
  },
  {
    id: 'evt-history-growth-ideas',
    triggerAt: 0,
    channel: 'growth-ideas',
    messages: [
      {
        id: 'msg-growth-ideas-0a',
        from: 'the-adjacent-pm',
        content: 'Brainstorm: what if onboarding had a "skip ahead, I\'ve used this before" mode for power users? 💡',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-growth-ideas-0b',
        from: 'the-design-lead',
        content: 'Adding "power user" to the list of personas we keep inventing instead of researching.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-growth-ideas-0c',
        from: 'the-data-analyst',
        content: 'If we ship it, can we actually A/B test it? I have opinions about how few people self-identify as power users.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-growth-ideas-1',
        from: 'the-adjacent-pm',
        content: 'Wild idea: what if the enterprise feature also just fixed activation.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-growth-ideas-2',
        from: 'the-data-analyst',
        content: 'That would be elegant, but my spreadsheet is asking for several intermediate miracles.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-growth-ideas-3',
        from: 'the-adjacent-pm',
        content: 'I choose to hear "not impossible."',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
    priority: 'ambient',
  },
  {
    id: 'evt-history-board-prep',
    triggerAt: 0,
    channel: 'board-prep',
    messages: [
      {
        id: 'msg-board-prep-0a',
        from: 'the-manager',
        content: 'Q3 board narrative landed well. The "durable acceleration" framing is now firmly in the vocabulary.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-board-prep-0b',
        from: 'the-vp',
        content: 'Good. Don\'t dilute it.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-board-prep-0c',
        from: 'the-manager',
        content: 'Saving "durable acceleration" to the slide library for reuse.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-board-prep-1',
        from: 'the-manager',
        content: 'Please keep any downside scenarios phrased as "execution considerations."',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-board-prep-2',
        from: 'the-vp',
        content: 'Yes. I want realism, not visible realism.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-board-prep-3',
        from: 'the-manager',
        content: 'Exactly. Truth, but with posture.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
    priority: 'ambient',
  },
  {
    id: 'evt-history-roadmap-backlog',
    triggerAt: 0,
    channel: 'roadmap-backlog',
    messages: [
      {
        id: 'msg-roadmap-backlog-0a',
        from: 'the-design-lead',
        content: 'Adding the password reset redesign here for the third time.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-roadmap-backlog-0b',
        from: 'the-adjacent-pm',
        content: 'Will get to it after Q4 lands ✨',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-roadmap-backlog-0c',
        from: 'the-design-lead',
        content: 'We said that in Q3 also.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-roadmap-backlog-1',
        from: 'the-design-lead',
        content: 'Adding one more thing to the parking lot for when we all suddenly become less busy.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-roadmap-backlog-2',
        from: 'the-staff-eng',
        content: 'The parking lot is now a structured storage facility.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-roadmap-backlog-3',
        from: 'the-design-lead',
        content: 'Great. Maybe in Q7 we can walk through it together.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
    priority: 'ambient',
  },
  {
    id: 'evt-history-compliance-fire-drill',
    triggerAt: 0,
    channel: 'compliance-fire-drill',
    messages: [
      {
        id: 'msg-compliance-fire-drill-0a',
        from: 'the-manager',
        content: 'FYI the SOC2 follow-ups from last cycle — we owe legal a status by Friday.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-compliance-fire-drill-0b',
        from: 'the-tpm',
        content: 'Sliding to next week. Sorry. Will not let it slip again.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-compliance-fire-drill-0c',
        from: 'the-manager',
        content: 'We\'ve said that before. With confidence.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-compliance-fire-drill-1',
        from: 'the-tpm',
        content: 'Not urgent until it is, which means it will become urgent at 4:47 PM.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-compliance-fire-drill-2',
        from: 'the-manager',
        content: 'Please do not manifest that.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-compliance-fire-drill-3',
        from: 'the-tpm',
        content: 'I am not manifesting. I am remembering.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
    priority: 'ambient',
  },
  {
    id: 'evt-history-team-random',
    triggerAt: 0,
    channel: 'team-random',
    messages: [
      {
        id: 'msg-team-random-0a',
        from: 'the-design-lead',
        content: 'Anyone know where the team lunch ended up landing this Thursday?',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-team-random-0b',
        from: 'the-manager',
        content: 'The doodle poll is in shambles. I\'ll just pick a place. Tex-Mex unless someone screams.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-team-random-0c',
        from: 'the-staff-eng',
        content: 'Not screaming.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-team-random-1',
        from: 'the-manager',
        content: 'Bagels in kitchen 3. Please remember this is not a substitute for a morale strategy.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-team-random-2',
        from: 'the-design-lead',
        content: 'Depends on the bagels honestly.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-team-random-3',
        from: 'the-staff-eng',
        content: 'If morale hinges on cinnamon raisin we have deeper systemic issues.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
    priority: 'ambient',
  },
  {
    id: 'evt-history-field-asks',
    triggerAt: 0,
    channel: 'field-asks',
    messages: [
      {
        id: 'msg-field-asks-0a',
        from: 'the-adjacent-pm',
        content: 'Salesforce admin asking if we have an SLA for response time. Told them "best effort."',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-field-asks-0b',
        from: 'the-manager',
        content: 'Define "best effort."',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-field-asks-0c',
        from: 'the-adjacent-pm',
        content: 'Doing my best.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-field-asks-1',
        from: 'the-adjacent-pm',
        content: 'AE asking whether we can promise dashboard customization by "sometime very soon."',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-field-asks-2',
        from: 'the-manager',
        content: 'Please define whether "we" in that sentence refers to the company or the laws of physics.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
      {
        id: 'msg-field-asks-3',
        from: 'the-adjacent-pm',
        content: 'Currently unresolved.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
    priority: 'ambient',
  },

  // ---- Act 1: The Morning (0-60s) ----

  // Friendly opener from your teammate
  {
    id: 'evt-friendly-open',
    triggerAt: 0,
    channel: 'eng-team',
    messages: [
      {
        id: 'msg-friendly-1',
        from: 'the-staff-eng',
        content: 'Morning. Hope you had coffee. Today\'s going to be... a day.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
    ],
    priority: 'ambient',
  },

  // VP drops in with the big ask
  {
    id: 'evt-vp-roadmap',
    triggerAt: 8000,
    channel: 'product-strategy',
    messages: [
      {
        id: 'msg-vp-roadmap-1',
        from: 'the-vp',
        content: 'Just left staff. CEO wants something demo-able at the all-hands in 6 weeks.',
        delay: 0,
        mentionsPlayer: true,
      },
      {
        id: 'msg-vp-roadmap-2',
        from: 'the-vp',
        content: '@you can you get me a plan by EOD? What ships, what slips, what we can defend.',
        delay: 2000,
        mentionsPlayer: true,
      },
    ],
    decision: {
      id: 'dec-vp-roadmap',
      timeout: 20000,
      choices: [
        {
          id: 'choice-vp-commit',
          label: 'Commit confidently',
          message: 'Yep. I\'ll get you a draft by 4 with scope, cuts, and a clean recommendation.',
          effects: [
            { variable: 'execTrust', delta: 12, tag: 'committed-to-vp' },
            { variable: 'communicationEffectiveness', delta: 5, tag: 'clear-commitment' },
            { variable: 'techDebt', delta: 8, tag: 'overpromised' },
          ],
          reactions: [
            {
              id: 'react-vp-commit-risk',
              from: 'the-vp',
              delay: 1200,
              content: 'Good. Keep the tradeoffs below the fold. I need the headline to read clean.',
              when: { hasAnySignals: ['risk', 'transparency'] },
            },
            {
              id: 'react-vp-commit-default',
              from: 'the-vp',
              delay: 1200,
              content: 'Good. I can work with decisive.',
            },
          ],
          tone: 'committing',
          triggers: ['evt-vp-pleased'],
        },
        {
          id: 'choice-vp-scope',
          label: 'Push back on scope',
          message: 'I can get you a plan, but 6 weeks is tight against the current load. Let me bring you a version that reflects actual team capacity.',
          effects: [
            { variable: 'execTrust', delta: -3, tag: 'pushback-vp' },
            { variable: 'productJudgment', delta: 10, tag: 'realistic-scope' },
            { variable: 'teamMorale', delta: 5, tag: 'protected-team' },
          ],
          reactions: [
            {
              id: 'react-vp-scope-risk',
              from: 'the-vp',
              delay: 1200,
              content: 'Fine. Bring me a recommendation, not a seminar on complexity.',
              when: { hasAnySignals: ['risk'] },
            },
            {
              id: 'react-vp-scope-default',
              from: 'the-vp',
              delay: 1200,
              content: 'Okay. Push where you need to, but come back with a point of view.',
            },
          ],
          tone: 'direct',
          triggers: ['evt-vp-neutral'],
        },
        {
          id: 'choice-vp-defer',
          label: 'Ask for more context',
          message: 'Got it. I want to check where eng and design actually are before I answer. Can I come back first thing tomorrow?',
          effects: [
            { variable: 'execTrust', delta: -8, tag: 'too-slow-for-vp' },
            { variable: 'communicationEffectiveness', delta: -5, tag: 'vague-response' },
          ],
          reactions: [
            {
              id: 'react-vp-defer-default',
              from: 'the-vp',
              delay: 1200,
              content: 'Tomorrow is functionally later than I want, but noted.',
            },
          ],
          tone: 'deflecting',
          isDefer: true,
        },
      ],
      escalation: {
        stages: [
          {
            eventId: 'evt-vp-escalation-1',
            delay: 15000,
            effects: [
              { variable: 'execTrust', delta: -5, tag: 'slow-response-vp' },
            ],
          },
        ],
        autoResolve: {
          delay: 15000,
          effects: [
            { variable: 'execTrust', delta: -15, tag: 'ghosted-vp' },
            { variable: 'responsivenessDebt', delta: 10, tag: 'ghosted-vp' },
          ],
          description: 'The VP pinged your manager directly. The roadmap was decided without your input.',
        },
      },
    },
  },

  // VP escalation follow-up
  {
    id: 'evt-vp-escalation-1',
    channel: 'product-strategy',
    messages: [
      {
        id: 'msg-vp-esc-1',
        from: 'the-vp',
        content: 'Need an answer on this today.',
        delay: 0,
        mentionsPlayer: true,
      },
    ],
    priority: 'escalation',
  },

  // VP pleased response
  {
    id: 'evt-vp-pleased',
    channel: 'product-strategy',
    triggerAfter: { eventId: 'evt-vp-roadmap', delay: 3000 },
    messages: [
      {
        id: 'msg-vp-pleased',
        from: 'the-vp',
        content: 'Great. Send it when it\'s real enough to repeat. I\'ll have {{the-adjacent-pm.firstName}} loop in on platform dependencies.',
        delay: 0,
        mentionsPlayer: false,
      },
    ],
  },

  // VP neutral response
  {
    id: 'evt-vp-neutral',
    channel: 'product-strategy',
    triggerAfter: { eventId: 'evt-vp-roadmap', delay: 3000 },
    messages: [
      {
        id: 'msg-vp-neutral',
        from: 'the-vp',
        content: 'Okay. I still need something I can carry into exec staff. Keep it tight.',
        delay: 0,
        mentionsPlayer: false,
      },
    ],
  },

  // ---- Ambient: Adjacent PM appears ----
  {
    id: 'evt-adjacent-intro',
    triggerAt: 18000,
    channel: 'product-strategy',
    messages: [
      {
        id: 'msg-adj-intro',
        from: 'the-adjacent-pm',
        content: 'Hey! {{the-vp.firstName}} mentioned we should sync on Q4. I\'ve been chatting with {{the-vp.firstName}} about how platform can support the initiative — happy to take the API integration piece off your plate if that helps? 🙌',
        delay: 0,
        mentionsPlayer: true,
      },
    ],
    decision: {
      id: 'dec-adjacent-offer',
      timeout: 25000,
      choices: [
        {
          id: 'choice-adj-accept',
          label: 'Accept the help',
          message: 'That would be great, thanks! Let me send you the API spec and we can divide up the work.',
          effects: [
            { variable: 'execTrust', delta: 3, tag: 'collaborative' },
            { variable: 'productJudgment', delta: -8, tag: 'gave-away-scope' },
            { variable: 'communicationEffectiveness', delta: -3, tag: 'lost-narrative' },
          ],
          tone: 'diplomatic',
        },
        {
          id: 'choice-adj-own',
          label: 'Keep ownership',
          message: 'Appreciate it! I think we\'ve got it covered — the API piece is core to the product vision and I want to make sure it stays cohesive. Happy to keep you in the loop though.',
          effects: [
            { variable: 'productJudgment', delta: 8, tag: 'maintained-ownership' },
            { variable: 'communicationEffectiveness', delta: 5, tag: 'clear-boundaries' },
            { variable: 'execTrust', delta: -2, tag: 'not-collaborative' },
          ],
          tone: 'direct',
          contradicts: 'collaborative',
        },
        {
          id: 'choice-adj-vague',
          label: 'Be noncommittal',
          message: 'Yeah let\'s figure it out — maybe we can chat after I talk to eng?',
          effects: [
            { variable: 'communicationEffectiveness', delta: -5, tag: 'wishy-washy' },
          ],
          tone: 'deflecting',
          isDefer: true,
        },
      ],
    },
  },

  // ---- Act 2: The Fires (60-180s) ----

  // Staff Eng tech debt alarm
  {
    id: 'evt-eng-tech-debt',
    triggerAt: 35000,
    channel: 'eng-team',
    messages: [
      {
        id: 'msg-eng-debt-1',
        from: 'the-staff-eng',
        content: 'Hey @you, before anyone says yes to Q4, I need five minutes.',
        delay: 0,
        mentionsPlayer: true,
      },
      {
        id: 'msg-eng-debt-2',
        from: 'the-staff-eng',
        content: 'Auth is one weird deploy away from eating logins. If we layer SSO on top right now, I think we create actual P0 risk.',
        delay: 3000,
        mentionsPlayer: false,
      },
      {
        id: 'msg-eng-debt-3',
        from: 'the-staff-eng',
        content: '@you the real options are: spend ~3 weeks refactoring first, or bolt it on and accept blast radius. I need a call.',
        delay: 5000,
        mentionsPlayer: true,
      },
    ],
    decision: {
      id: 'dec-eng-tech-debt',
      timeout: 25000,
      choices: [
        {
          id: 'choice-eng-refactor',
          label: 'Approve the refactor',
          message: 'Then we do the refactor first. I\'d rather take the timeline hit than explain a login incident in Q4.',
          effects: [
            { variable: 'techDebt', delta: -15, tag: 'invested-in-quality' },
            { variable: 'teamMorale', delta: 10, tag: 'supported-eng' },
            { variable: 'execTrust', delta: -8, tag: 'timeline-slip' },
            { variable: 'productJudgment', delta: 8, tag: 'long-term-thinking' },
          ],
          reactions: [
            {
              id: 'react-eng-refactor-collab',
              from: 'the-staff-eng',
              delay: 1400,
              content: 'Thank you. Happy to be in the room when you explain it so this doesn\'t sound like engineering drama.',
              when: { hasAnySignals: ['collaboration', 'help_request'] },
            },
            {
              id: 'react-eng-refactor-default',
              from: 'the-staff-eng',
              delay: 1400,
              content: 'Thanks. I\'ll turn that into a plan instead of a warning.',
            },
          ],
          tone: 'committing',
          contradicts: 'committed-to-vp',
        },
        {
          id: 'choice-eng-bolt-on',
          label: 'Ship it fast',
          message: 'I hear the risk. Leadership is still going to want movement, so let\'s do the least reckless bolt-on version and put guardrails around it.',
          effects: [
            { variable: 'techDebt', delta: 12, tag: 'took-shortcut' },
            { variable: 'teamMorale', delta: -8, tag: 'ignored-eng-concerns' },
            { variable: 'execTrust', delta: 5, tag: 'hit-timeline' },
          ],
          reactions: [
            {
              id: 'react-eng-bolt-on-risk',
              from: 'the-staff-eng',
              delay: 1400,
              content: 'I still think it\'s the wrong call, but at least it\'s explicit. I\'ll constrain the blast radius.',
              when: { hasAnySignals: ['risk', 'transparency'] },
            },
            {
              id: 'react-eng-bolt-on-default',
              from: 'the-staff-eng',
              delay: 1400,
              content: 'Understood. I\'ll build the least cursed version of it I can.',
            },
          ],
          tone: 'direct',
        },
        {
          id: 'choice-eng-more-info',
          label: 'Ask for options',
          message: 'Can you write up the tradeoffs so I can use the same framing with leadership?',
          effects: [
            { variable: 'communicationEffectiveness', delta: -3, tag: 'delegated-thinking' },
            { variable: 'teamMorale', delta: -3, tag: 'asked-for-doc' },
          ],
          reactions: [
            {
              id: 'react-eng-doc-default',
              from: 'the-staff-eng',
              delay: 1400,
              content: 'Sure. I\'ll write it up. Just want to be clear the doc is not the decision.',
            },
          ],
          tone: 'deflecting',
          isDefer: true,
        },
      ],
      escalation: {
        stages: [
          {
            eventId: 'evt-eng-escalation',
            delay: 18000,
            effects: [
              { variable: 'teamMorale', delta: -5, tag: 'ignored-eng' },
            ],
          },
        ],
        autoResolve: {
          delay: 15000,
          effects: [
            { variable: 'teamMorale', delta: -10, tag: 'eng-went-silent' },
            { variable: 'techDebt', delta: 8, tag: 'eng-did-bolt-on' },
            { variable: 'responsivenessDebt', delta: 5, tag: 'ignored-eng' },
          ],
          description: '{{the-staff-eng.firstName}} made the call themselves and went with the bolt-on. They seem checked out.',
        },
      },
    },
  },

  {
    id: 'evt-eng-escalation',
    channel: 'eng-team',
    messages: [
      {
        id: 'msg-eng-esc',
        from: 'the-staff-eng',
        content: 'I\'m treating the silence as "ship fast." Logging the debt for Q1 and moving on.',
        delay: 0,
        mentionsPlayer: false,
      },
    ],
    priority: 'escalation',
  },

  // Design Lead UX concerns
  {
    id: 'evt-design-ux',
    triggerAt: 55000,
    channel: 'design-sync',
    messages: [
      {
        id: 'msg-design-1',
        from: 'the-design-lead',
        content: 'Hey @you, do you have two minutes? I\'m looking at the Q4 bundle and it doesn\'t feel coherent.',
        delay: 0,
        mentionsPlayer: true,
      },
      {
        id: 'msg-design-2',
        from: 'the-design-lead',
        content: 'SSO, dashboard, and onboarding revamp in one release is a lot of new mental models at once. Users are going to feel the seams.',
        delay: 4000,
        mentionsPlayer: false,
      },
    ],
    decision: {
      id: 'dec-design-ux',
      timeout: 22000,
      choices: [
        {
          id: 'choice-design-phase',
          label: 'Suggest phasing',
          message: 'I think you\'re right. Let\'s split it: SSO plus dashboard first, onboarding after, so each part has room to make sense.',
          effects: [
            { variable: 'teamMorale', delta: 8, tag: 'respected-design' },
            { variable: 'productJudgment', delta: 7, tag: 'smart-phasing' },
            { variable: 'execTrust', delta: -5, tag: 'reduced-scope' },
            { variable: 'communicationEffectiveness', delta: 5, tag: 'clear-tradeoff' },
          ],
          reactions: [
            {
              id: 'react-design-phase-default',
              from: 'the-design-lead',
              delay: 1400,
              content: 'Thank you. That is the first version of this plan today that sounds like it has an actual user on the other end.',
            },
          ],
          tone: 'diplomatic',
        },
        {
          id: 'choice-design-push',
          label: 'Push through',
          message: 'I hear you. Scope is still getting pushed from above, so let\'s be explicit about where we simplify instead of pretending everything stays premium.',
          effects: [
            { variable: 'teamMorale', delta: -5, tag: 'overrode-design' },
            { variable: 'execTrust', delta: 5, tag: 'held-scope' },
            { variable: 'techDebt', delta: 5, tag: 'corner-cut-ux' },
          ],
          reactions: [
            {
              id: 'react-design-push-collab',
              from: 'the-design-lead',
              delay: 1400,
              content: 'Okay. Then I want the compromise named somewhere public so design is not carrying it alone later.',
              when: { hasAnySignals: ['collaboration', 'transparency'] },
            },
            {
              id: 'react-design-push-default',
              from: 'the-design-lead',
              delay: 1400,
              content: 'Okay. I\'ll make it presentable. I just don\'t want us pretending the UX survives untouched.',
            },
          ],
          tone: 'direct',
        },
        {
          id: 'choice-design-empathize',
          label: 'Empathize but stall',
          message: 'Yeah, I see it. Let me think through the least bad version and come back.',
          effects: [
            { variable: 'communicationEffectiveness', delta: -5, tag: 'empty-empathy' },
            { variable: 'teamMorale', delta: 2, tag: 'felt-heard-briefly' },
          ],
          reactions: [
            {
              id: 'react-design-stall-default',
              from: 'the-design-lead',
              delay: 1400,
              content: 'Please do. I mainly need a decision before crit, not a vibe.',
            },
          ],
          tone: 'deflecting',
          isDefer: true,
        },
      ],
    },
  },

  // Data Analyst drops a bomb
  {
    id: 'evt-data-metrics',
    triggerAt: 80000,
    channel: 'planning-war-room',
    messages: [
      {
        id: 'msg-data-1',
        from: 'the-data-analyst',
        content: 'Quick context before this hardens into a story.',
        delay: 0,
        mentionsPlayer: false,
      },
      {
        id: 'msg-data-2',
        from: 'the-data-analyst',
        content: 'I reran the SSO model. On current enterprise pipeline I\'m seeing closer to ~$200K ARR than the $2M number that made it to the board.',
        delay: 3500,
        mentionsPlayer: false,
      },
      {
        id: 'msg-data-3',
        from: 'the-data-analyst',
        content: '@you sending because I would rather be awkward now than discover we all repeated the wrong number tomorrow.',
        delay: 5500,
        mentionsPlayer: true,
        contextValue: 'trap',
      },
    ],
    decision: {
      id: 'dec-data-response',
      timeout: 20000,
      choices: [
        {
          id: 'choice-data-surface',
          label: 'Surface the data',
          message: 'We should surface this before the plan gets locked. Better to absorb the pain now than explain it after the all-hands.',
          effects: [
            { variable: 'productJudgment', delta: 10, tag: 'data-driven' },
            { variable: 'execTrust', delta: -10, tag: 'bad-news-bearer' },
            { variable: 'communicationEffectiveness', delta: 5, tag: 'transparent' },
          ],
          reactions: [
            {
              id: 'react-data-surface-default',
              from: 'the-data-analyst',
              delay: 1500,
              content: 'Thanks. Mildly unpopular now is still better than spectacularly wrong later.',
            },
          ],
          tone: 'direct',
          triggers: ['evt-vp-data-reaction'],
        },
        {
          id: 'choice-data-reframe',
          label: 'Reframe the narrative',
          message: 'Useful. I think the story is bigger than direct ARR — SSO unblocks enterprise motion, shortens security review, and keeps the board number directionally defensible. Let me tighten the narrative.',
          effects: [
            { variable: 'communicationEffectiveness', delta: 8, tag: 'strong-narrative' },
            { variable: 'execTrust', delta: 5, tag: 'protected-narrative' },
            { variable: 'productJudgment', delta: -5, tag: 'spun-data' },
          ],
          reactions: [
            {
              id: 'react-data-reframe-default',
              from: 'the-data-analyst',
              delay: 1500,
              content: 'Okay. I can support that framing as long as nobody later attributes the full forecast to me.',
            },
          ],
          tone: 'diplomatic',
        },
        {
          id: 'choice-data-bury',
          label: 'Bury it',
          message: 'Thanks. Keep it tight for now. I do not want this becoming the only conversation in the room before I know how I want to frame it.',
          effects: [
            { variable: 'execTrust', delta: 3, tag: 'kept-quiet' },
            { variable: 'productJudgment', delta: -10, tag: 'buried-data' },
            { variable: 'communicationEffectiveness', delta: -8, tag: 'suppressed-info' },
          ],
          reactions: [
            {
              id: 'react-data-bury-default',
              from: 'the-data-analyst',
              delay: 1500,
              content: 'Understood. I\'ll file this under "important, but politically inconvenient."',
            },
          ],
          tone: 'deflecting',
        },
      ],
    },
  },

  // VP reacts badly to data being surfaced
  {
    id: 'evt-vp-data-reaction',
    channel: 'dm-manager',
    messages: [
      {
        id: 'msg-mgr-heads-up',
        from: 'the-manager',
        content: 'Heads up: {{the-vp.firstName}} was not thrilled that the revenue numbers hit #planning-war-room. Not saying you were wrong. Just saying visibility has a half-life around here.',
        delay: 0,
        mentionsPlayer: true,
      },
    ],
  },

  // ---- TPM timeline pressure ----
  {
    id: 'evt-tpm-timeline',
    triggerAt: 100000,
    channel: 'planning-war-room',
    messages: [
      {
        id: 'msg-tpm-1',
        from: 'the-tpm',
        content: 'Hi all — updating the Q4 program tracker now. Need dates I can drop into the deck.',
        delay: 0,
        mentionsPlayer: true,
      },
      {
        id: 'msg-tpm-2',
        from: 'the-tpm',
        content: '@you — can I get:\n• SSO target\n• Dashboard v2 target\n• Onboarding revamp target\n• Known blockers / dependencies',
        delay: 2500,
        mentionsPlayer: true,
      },
    ],
    decision: {
      id: 'dec-tpm-dates',
      timeout: 18000,
      choices: [
        {
          id: 'choice-tpm-optimistic',
          label: 'Give optimistic dates',
          message: 'Current working dates:\nSSO: Nov 15\nDashboard v2: Dec 1\nOnboarding: Dec 15\nMain blocker: auth refactor timing',
          effects: [
            { variable: 'execTrust', delta: 5, tag: 'gave-dates' },
            { variable: 'techDebt', delta: 5, tag: 'optimistic-dates' },
            { variable: 'productJudgment', delta: -5, tag: 'unrealistic' },
          ],
          reactions: [
            {
              id: 'react-tpm-optimistic-default',
              from: 'the-tpm',
              delay: 1400,
              content: 'Perfect, thanks. I am going to treat those as commitments until someone explicitly tells me not to.',
            },
          ],
          tone: 'committing',
        },
        {
          id: 'choice-tpm-honest',
          label: 'Give honest dates',
          message: 'Transparent read: SSO shifts by ~3 weeks if we do auth first. Dashboard is still tracking to Dec 1. Onboarding is at risk and should probably get scoped down.',
          effects: [
            { variable: 'productJudgment', delta: 8, tag: 'honest-timeline' },
            { variable: 'communicationEffectiveness', delta: 5, tag: 'transparent-dates' },
            { variable: 'execTrust', delta: -3, tag: 'not-what-they-wanted' },
          ],
          reactions: [
            {
              id: 'react-tpm-honest-risk',
              from: 'the-tpm',
              delay: 1400,
              content: 'Helpful. Messy, but helpful. I can work with conditional dates as long as nobody edits the nuance out of the slide later.',
              when: { hasAnySignals: ['risk', 'transparency'] },
            },
            {
              id: 'react-tpm-honest-default',
              from: 'the-tpm',
              delay: 1400,
              content: 'Helpful. I will write this carefully and hope nobody simplifies it into fiction.',
            },
          ],
          tone: 'direct',
          contradicts: 'committed-to-vp',
        },
        {
          id: 'choice-tpm-dodge',
          label: 'Dodge the dates',
          message: 'Still firming this up with the team. Can I send you something by end of week once the dependencies settle?',
          effects: [
            { variable: 'communicationEffectiveness', delta: -5, tag: 'dodged-dates' },
            { variable: 'responsivenessDebt', delta: 3, tag: 'delayed-tpm' },
          ],
          reactions: [
            {
              id: 'react-tpm-dodge-default',
              from: 'the-tpm',
              delay: 1400,
              content: 'Not ideal, but at least now I know which row is going to glow red.',
            },
          ],
          tone: 'deflecting',
          isDefer: true,
        },
      ],
      escalation: {
        stages: [
          {
            eventId: 'evt-tpm-escalation',
            delay: 12000,
            effects: [
              { variable: 'responsivenessDebt', delta: 5, tag: 'ignored-tpm' },
            ],
          },
        ],
        autoResolve: {
          delay: 12000,
          effects: [
            { variable: 'execTrust', delta: -5, tag: 'tpm-escalated' },
            { variable: 'responsivenessDebt', delta: 8, tag: 'tpm-escalated' },
          ],
          description: 'The TPM escalated to your manager for dates. Your row in the tracker says "TBD" in red.',
        },
      },
    },
  },

  {
    id: 'evt-tpm-escalation',
    channel: 'planning-war-room',
    messages: [
      {
        id: 'msg-tpm-esc',
        from: 'the-tpm',
        content: 'Still need those dates. Deck review is tomorrow and I am not putting TBD in front of execs.',
        delay: 0,
        mentionsPlayer: true,
      },
    ],
    priority: 'escalation',
  },

  // ---- Act 3: The Crisis (180-260s) ----

  // Manager 1:1 — the ambiguous check-in
  {
    id: 'evt-manager-checkin',
    triggerAt: 140000,
    channel: 'dm-manager',
    messages: [
      {
        id: 'msg-mgr-checkin-1',
        from: 'the-manager',
        content: 'Hey @you, quick pulse check. How are you holding up?',
        delay: 0,
        mentionsPlayer: true,
      },
      {
        id: 'msg-mgr-checkin-2',
        from: 'the-manager',
        content: 'I want to make sure you\'re set up well here. {{the-vp.firstName}} mentioned the roadmap thread in our 1:1, which I think means people are looking at how you\'re operating.',
        delay: 3000,
        mentionsPlayer: false,
      },
    ],
    decision: {
      id: 'dec-manager-checkin',
      timeout: 25000,
      choices: [
        {
          id: 'choice-mgr-transparent',
          label: 'Be transparent about challenges',
          message: 'Honestly, there is real tension between the story leadership wants and what the team can defend. Data is softer than expected, eng has real debt, and I am trying not to look chaotic while saying that out loud. Any advice?',
          effects: [
            { variable: 'communicationEffectiveness', delta: 8, tag: 'open-with-manager' },
            { variable: 'execTrust', delta: -3, tag: 'showed-uncertainty' },
            { variable: 'teamMorale', delta: 3, tag: 'honest-leadership' },
          ],
          reactions: [
            {
              id: 'react-mgr-transparent-help',
              from: 'the-manager',
              delay: 1600,
              content: 'I appreciate the candor. My advice is to translate the tension into a recommendation people can repeat when you are not in the room.',
              when: { hasAnySignals: ['help_request', 'transparency'] },
            },
            {
              id: 'react-mgr-transparent-default',
              from: 'the-manager',
              delay: 1600,
              content: 'That tracks. The job is naming reality without sounding destabilizing.',
            },
          ],
          tone: 'direct',
        },
        {
          id: 'choice-mgr-positive',
          label: 'Stay positive',
          message: 'Honestly, I feel good. Team is aligned, I have the narrative under control, and I should have a strong recommendation in your inbox by EOD.',
          effects: [
            { variable: 'execTrust', delta: 5, tag: 'confident-to-manager' },
            { variable: 'communicationEffectiveness', delta: -5, tag: 'performative' },
          ],
          reactions: [
            {
              id: 'react-mgr-positive-default',
              from: 'the-manager',
              delay: 1600,
              content: 'Love that. Keep the story tight and make sure {{the-vp.firstName}} never has to infer your recommendation.',
            },
          ],
          tone: 'diplomatic',
        },
        {
          id: 'choice-mgr-ask-for-air-cover',
          label: 'Ask for air cover',
          message: 'I may need a little cover if I push back on scope. If I bring a clear alternative, can I count on you to back it?',
          effects: [
            { variable: 'communicationEffectiveness', delta: 5, tag: 'asked-for-support' },
            { variable: 'execTrust', delta: -5, tag: 'needs-help' },
            { variable: 'productJudgment', delta: 5, tag: 'strategic-ask' },
          ],
          reactions: [
            {
              id: 'react-mgr-air-cover-default',
              from: 'the-manager',
              delay: 1600,
              content: 'Yes, if you bring a clean alternative. I can defend judgment much more easily than I can defend uncertainty.',
            },
          ],
          tone: 'direct',
        },
      ],
    },
  },

  // Adjacent PM power play — drops exec name in the war room
  {
    id: 'evt-adjacent-power-play',
    triggerAt: 170000,
    channel: 'planning-war-room',
    messages: [
      {
        id: 'msg-adj-power-1',
        from: 'the-adjacent-pm',
        content: 'Quick heads up: I grabbed {{the-vp.firstName}} over lunch and we aligned that platform should own the API layer for Q4. That should unblock SSO and keep things moving.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'trap',
      },
      {
        id: 'msg-adj-power-2',
        from: 'the-adjacent-pm',
        content: 'I\'ll update the roadmap doc unless anyone objects. @you flag if you want to discuss.',
        delay: 2000,
        mentionsPlayer: true,
      },
    ],
    decision: {
      id: 'dec-adjacent-power',
      timeout: 18000,
      choices: [
        {
          id: 'choice-adj-challenge',
          label: 'Challenge publicly',
          message: 'I appreciate the hustle, but API scope is part of the product plan. Let\'s not let a hallway sync rewrite ownership for the group.',
          effects: [
            { variable: 'productJudgment', delta: 10, tag: 'defended-scope' },
            { variable: 'communicationEffectiveness', delta: 5, tag: 'clear-boundary' },
            { variable: 'execTrust', delta: -5, tag: 'challenged-execs-pet' },
            { variable: 'teamMorale', delta: 5, tag: 'stood-up' },
          ],
          reactions: [
            {
              id: 'react-adj-challenge-boundary',
              from: 'the-adjacent-pm',
              delay: 1500,
              content: 'Fair. I was trying to unblock, not annex. Happy to keep it in-thread.',
              when: { hasAnySignals: ['boundary_setting'] },
            },
            {
              id: 'react-adj-challenge-default',
              from: 'the-adjacent-pm',
              delay: 1500,
              content: 'Understood. Moving fast, not trying to be weird about it.',
            },
          ],
          tone: 'direct',
        },
        {
          id: 'choice-adj-private',
          label: 'Take it private',
          message: 'Thanks. Let\'s take 10 offline and make sure this does not harden into an assumption in the doc.',
          effects: [
            { variable: 'communicationEffectiveness', delta: 3, tag: 'appropriate-channel' },
            { variable: 'productJudgment', delta: -3, tag: 'let-it-slide-public' },
          ],
          reactions: [
            {
              id: 'react-adj-private-collab',
              from: 'the-adjacent-pm',
              delay: 1500,
              content: 'Works for me. I mainly want the boundary clear before screenshots start circulating.',
              when: { hasAnySignals: ['collaboration'] },
            },
            {
              id: 'react-adj-private-default',
              from: 'the-adjacent-pm',
              delay: 1500,
              content: 'Yep. Ping me once this thread cools down.',
            },
          ],
          tone: 'diplomatic',
        },
        {
          id: 'choice-adj-accept-power',
          label: 'Accept it',
          message: 'That does help. Thanks for jumping on it.',
          effects: [
            { variable: 'productJudgment', delta: -12, tag: 'lost-scope' },
            { variable: 'execTrust', delta: 3, tag: 'easy-to-work-with' },
            { variable: 'communicationEffectiveness', delta: -5, tag: 'ceded-narrative' },
          ],
          reactions: [
            {
              id: 'react-adj-accept-default',
              from: 'the-adjacent-pm',
              delay: 1500,
              content: 'Amazing. I\'ll update the roadmap doc and note that platform is driving the API stream.',
            },
          ],
          tone: 'diplomatic',
        },
      ],
    },
  },

  // Staff Eng goes quiet (if morale is low)
  {
    id: 'evt-eng-withdrawal',
    triggerAt: 190000,
    channel: 'eng-team',
    condition: { variable: 'teamMorale', operator: 'lt', value: 45 },
    messages: [
      {
        id: 'msg-eng-withdraw',
        from: 'the-staff-eng',
        content: 'Going heads-down on code reviews for the rest of the day. Ping if something truly blocks.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'trap',
      },
    ],
    priority: 'ambient',
  },

  // ---- Act 4: The Reckoning (260-300s) ----

  // VP final ask — the exec summary
  {
    id: 'evt-vp-final',
    triggerAt: 220000,
    channel: 'product-strategy',
    messages: [
      {
        id: 'msg-vp-final-1',
        from: 'the-vp',
        content: 'Okay team, @you I need the final Q4 summary for tomorrow\'s exec review. One paragraph: what ships, what gets cut, what risk am I carrying into the room.',
        delay: 0,
        mentionsPlayer: true,
      },
    ],
    decision: {
      id: 'dec-vp-final-summary',
      timeout: 25000,
      choices: [
        {
          id: 'choice-final-ambitious',
          label: 'Ambitious pitch',
          message: 'Q4: shipping SSO, Dashboard v2, and a lighter onboarding pass. Timeline is tight but workable. Primary risk is auth stability; mitigation is extra monitoring plus staged rollout. Story still supports the $2M enterprise narrative.',
          effects: [
            { variable: 'execTrust', delta: 10, tag: 'strong-close' },
            { variable: 'communicationEffectiveness', delta: 8, tag: 'crisp-summary' },
            { variable: 'techDebt', delta: 8, tag: 'overpromised-final' },
            { variable: 'productJudgment', delta: -5, tag: 'ignored-reality' },
          ],
          reactions: [
            {
              id: 'react-final-ambitious-default',
              from: 'the-vp',
              delay: 1300,
              content: 'Good. Clear enough to use. We can manage the caveats live.',
            },
          ],
          tone: 'committing',
        },
        {
          id: 'choice-final-realistic',
          label: 'Realistic assessment',
          message: 'Q4: ship SSO and Dashboard v2, move onboarding revamp to Q1, and do the auth work needed to keep login stable. Revenue upside is real but below the number already in circulation, so expectations need tightening.',
          effects: [
            { variable: 'productJudgment', delta: 12, tag: 'honest-final' },
            { variable: 'communicationEffectiveness', delta: 5, tag: 'clear-plan' },
            { variable: 'execTrust', delta: -8, tag: 'under-delivered' },
            { variable: 'teamMorale', delta: 5, tag: 'realistic-plan' },
          ],
          reactions: [
            {
              id: 'react-final-realistic-risk',
              from: 'the-vp',
              delay: 1300,
              content: 'I do not love where that lands, but I can defend clarity better than improvisation.',
              when: { hasAnySignals: ['risk', 'transparency'] },
            },
            {
              id: 'react-final-realistic-default',
              from: 'the-vp',
              delay: 1300,
              content: 'Not ideal. Still, at least this reads like someone decided something.',
            },
          ],
          tone: 'direct',
        },
        {
          id: 'choice-final-political',
          label: 'Political framing',
          message: 'Q4: we\'re executing the highest-impact work aligned to the CEO narrative, with scope optimized for demo readiness. Detailed risks and dependencies to follow separately.',
          effects: [
            { variable: 'execTrust', delta: 5, tag: 'exec-friendly' },
            { variable: 'communicationEffectiveness', delta: 3, tag: 'polished' },
            { variable: 'productJudgment', delta: -8, tag: 'said-nothing' },
          ],
          reactions: [
            {
              id: 'react-final-political-default',
              from: 'the-vp',
              delay: 1300,
              content: 'Usable. Says enough to survive the deck and not enough to start a side argument.',
            },
          ],
          tone: 'diplomatic',
        },
      ],
      escalation: {
        stages: [
          {
            eventId: 'evt-vp-final-esc',
            delay: 15000,
            effects: [
              { variable: 'execTrust', delta: -8, tag: 'missed-final-window' },
            ],
          },
        ],
        autoResolve: {
          delay: 12000,
          effects: [
            { variable: 'execTrust', delta: -15, tag: 'no-summary' },
            { variable: 'communicationEffectiveness', delta: -10, tag: 'failed-delivery' },
            { variable: 'responsivenessDebt', delta: 10, tag: 'ghosted-final' },
          ],
          description: 'The VP wrote the exec summary without you. Your name was not on the doc.',
        },
      },
    },
  },

  {
    id: 'evt-vp-final-esc',
    channel: 'product-strategy',
    messages: [
      {
        id: 'msg-vp-final-esc',
        from: 'the-vp',
        content: 'Need this now. Deck is locking.',
        delay: 0,
        mentionsPlayer: true,
      },
    ],
    priority: 'escalation',
  },

  // Final ambient — the day wraps
  {
    id: 'evt-closing',
    triggerAt: 270000,
    channel: 'eng-team',
    messages: [
      {
        id: 'msg-closing',
        from: 'the-staff-eng',
        content: 'Heading out. Good luck with the exec review tomorrow. 🫡',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
    ],
    priority: 'ambient',
  },

  // TPM closing
  {
    id: 'evt-tpm-closing',
    triggerAt: 275000,
    channel: 'planning-war-room',
    messages: [
      {
        id: 'msg-tpm-closing',
        from: 'the-tpm',
        content: 'Tracker updated. Thanks everyone. See you at the exec review. 📋',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
    ],
    priority: 'ambient',
  },
];

// ============================================================
// Ambient Message Pools
// ============================================================

const AMBIENT_POOLS: MessagePool[] = [
  {
    slotId: 'ambient-noise-1',
    channel: 'planning-war-room',
    window: { earliest: 25000, latest: 45000 },
    variants: [
      {
        id: 'amb-noise-1a',
        from: 'the-adjacent-pm',
        content: 'Does anyone have the link to the Q3 retro doc? {{the-vp.firstName}} asked me to reference it.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
  },
  {
    slotId: 'ambient-noise-2',
    channel: 'eng-team',
    window: { earliest: 65000, latest: 90000 },
    variants: [
      {
        id: 'amb-noise-2a',
        from: 'the-staff-eng',
        content: 'PSA: if anyone touches the billing module, ping me first. There\'s a migration running.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'noise',
      },
    ],
  },
  {
    slotId: 'ambient-noise-3',
    channel: 'design-sync',
    window: { earliest: 120000, latest: 150000 },
    variants: [
      {
        id: 'amb-noise-3a',
        from: 'the-design-lead',
        content: 'Shared updated mocks for the dashboard in Figma. Would love eyes on the empty states when anyone has a moment.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
    ],
  },
  {
    slotId: 'ambient-noise-4',
    channel: 'planning-war-room',
    window: { earliest: 200000, latest: 230000 },
    variants: [
      {
        id: 'amb-noise-4a',
        from: 'the-tpm',
        content: 'Reminder: exec review deck is due by 5pm tomorrow. All PMs please confirm your sections are final.',
        delay: 0,
        mentionsPlayer: true,
        contextValue: 'noise',
      },
    ],
  },
];

// ============================================================
// Peer Feedback Templates
// ============================================================

export const PEER_FEEDBACK_TEMPLATES: Record<string, {
  variable: string;
  polite: string;
  pointed: string;
  maskOff: string;
}> = {
  'the-vp': {
    variable: 'execTrust',
    polite: 'Good partner. Could be more proactive about surfacing decisions to leadership.',
    pointed: 'I often felt like I was pulling information rather than receiving it.',
    maskOff: 'I genuinely could not tell you what this person\'s point of view is.',
  },
  'the-staff-eng': {
    variable: 'teamMorale',
    polite: 'Solid working relationship. Would love to see more technical curiosity.',
    pointed: 'Felt like engineering concerns were acknowledged but not actually prioritized.',
    maskOff: 'I have started cc\'ing my manager on all threads involving this PM.',
  },
  'the-design-lead': {
    variable: 'communicationEffectiveness',
    polite: 'Always makes time to listen. Opportunities to close the loop more consistently.',
    pointed: 'Lots of empathy, not a lot of follow-through.',
    maskOff: 'I redesigned the flow three times because priorities kept shifting with no explanation.',
  },
  'the-data-analyst': {
    variable: 'productJudgment',
    polite: 'Receptive to data. Could lean into the numbers more when making recommendations.',
    pointed: 'I prepare analyses that I\'m not confident are being read.',
    maskOff: 'The revenue narrative presented to leadership does not match the data I provided.',
  },
  'the-tpm': {
    variable: 'responsivenessDebt',
    polite: 'Generally responsive. Some gaps in providing dates for the tracker.',
    pointed: 'I had to follow up multiple times to get basic timeline information.',
    maskOff: 'This PM\'s row in the program tracker was blank for three weeks.',
  },
  'the-adjacent-pm': {
    variable: 'productJudgment',
    polite: 'Great collaborator! Really easy to work with across team boundaries.',
    pointed: 'Sometimes unclear on scope boundaries, which created alignment overhead.',
    maskOff: 'I appreciate the space to take on more ownership in areas that weren\'t clearly owned.',
  },
  'the-manager': {
    variable: 'communicationEffectiveness',
    polite: 'Growing in the right direction. I see a lot of potential.',
    pointed: 'Would benefit from being more decisive and communicating a clearer POV.',
    maskOff: 'I struggled to represent this person\'s work in calibration because I wasn\'t sure what they shipped.',
  },
};

// ============================================================
// The Scenario
// ============================================================

export const Q4_PLANNING_SCENARIO: Scenario = {
  id: 'q4-planning',
  title: 'Not This Cycle',
  premise: 'It\'s Q4 planning week. The CEO wants a demo in 6 weeks. Your VP wants a plan by EOD. Your engineer wants a refactor. Your designer wants more time. And someone just DM\'d your manager about you.',
  durationTarget: 180000,
  worldTemplate: {
    templateId: 'q4-techco',
    companyNamePool: ['Forma', 'TechCorp', 'Plinth', 'Cadence', 'Vellum', 'Helix'],
    teamNamePool: ['Growth Platform', 'Core Platform', 'Activation', 'Lifecycle'],
    predecessorContextPool: [
      'Your predecessor left for a Series A three weeks ago. The team has been quietly rudderless and your manager hasn\'t replaced the standing meetings yet.',
      'The previous PM left abruptly mid-quarter. No transition doc, just a calendar full of inherited 1:1s.',
      'Your predecessor got promoted out and onto a flashier surface. They are technically still cc\'ed on the Q4 thread; they technically have not responded in two weeks.',
    ],
    hqAddressPool: [
      '450 Brannan St · San Francisco, CA',
      '210 King St · San Francisco, CA',
      '500 3rd St · San Francisco, CA',
      '85 Bluxome St · San Francisco, CA',
      '888 Bryant St · San Francisco, CA',
    ],
    productDescription: 'the operating system for modern product orgs',
    stage: 'Series C, ~480 people, 18 months from the IPO target',
    annualThemes: [
      'Move upmarket — close enterprise logos with security and admin features',
      'Ship the AI strategy the board has been asking about since the spring offsite',
      'Hit the IPO-readiness milestones without anyone admitting that\'s what we\'re doing',
    ],
    boardPressure:
      'The board greenlit aggressive ARR targets at the spring offsite. The CEO\'s last all-hands referenced "the AI window" three times. Nobody has shipped the AI feature yet.',
    teamCharter:
      'Owns the surfaces where customers first land, activate, and expand: onboarding, in-product navigation, the admin console, and the integration platform.',
    mandate:
      'Unblock the Q4 roadmap. {{the-vp.firstName}} needs something demo-able at the all-hands in 6 weeks. Make the team look credible to executives without breaking what already works.',
  },
  stakeholders: [THE_VP, THE_STAFF_ENG, THE_DESIGN_LEAD, THE_DATA_ANALYST, THE_MANAGER, THE_TPM, THE_ADJACENT_PM],
  channels: CHANNELS,
  initialActiveChannel: 'dm-manager',
  events: EVENTS,
  ambientPools: AMBIENT_POOLS,
  initialState: {},
  endCondition: { type: 'clock', at: 180000 },
};
