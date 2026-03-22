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
  { id: 'product-strategy', name: 'product-strategy', type: 'channel', description: 'Q4 roadmap planning' },
  { id: 'eng-team', name: 'eng-team', type: 'channel', description: 'Engineering updates' },
  { id: 'design-sync', name: 'design-sync', type: 'channel', description: 'Design reviews' },
  { id: 'planning-war-room', name: 'planning-war-room', type: 'channel', description: 'Cross-functional planning' },
  { id: 'dm-manager', name: '{{the-manager.firstName}} {{the-manager.lastName}}', type: 'dm' },
  { id: 'dm-staff-eng', name: '{{the-staff-eng.firstName}} {{the-staff-eng.lastName}}', type: 'dm' },
  { id: 'dm-design-lead', name: '{{the-design-lead.firstName}} {{the-design-lead.lastName}}', type: 'dm' },
];

// ============================================================
// Game Events
// ============================================================

const EVENTS: GameEvent[] = [
  // ---- Warm-start: pre-existing channel history ----

  // Context already in product-strategy when you arrive
  {
    id: 'evt-history-product',
    triggerAt: 0,
    channel: 'product-strategy',
    messages: [
      {
        id: 'msg-history-1',
        from: 'the-manager',
        content: 'Heads up team — Q4 planning kicks off today. {{the-vp.firstName}} wants a roadmap locked by end of week. Let\'s stay aligned.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-history-2',
        from: 'the-design-lead',
        content: 'Sounds good. I\'ll have the updated mocks ready for review this afternoon.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
      {
        id: 'msg-history-3',
        from: 'the-staff-eng',
        content: 'Just flagging — there are some tech debt items we should discuss before locking scope.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'ambient',
      },
    ],
    priority: 'ambient',
  },

  // Manager DM — morning greeting
  {
    id: 'evt-history-dm-manager',
    triggerAt: 0,
    channel: 'dm-manager',
    messages: [
      {
        id: 'msg-dm-mgr-morning',
        from: 'the-manager',
        content: 'Good morning! Big day today. Let me know if you need anything — I\'m in back-to-backs but can make time.',
        delay: 0,
        mentionsPlayer: true,
        contextValue: 'ambient',
      },
    ],
    priority: 'ambient',
  },

  // Staff Eng DM — heads up
  {
    id: 'evt-history-dm-eng',
    triggerAt: 0,
    channel: 'dm-staff-eng',
    messages: [
      {
        id: 'msg-dm-eng-morning',
        from: 'the-staff-eng',
        content: 'Hey — got a sec later today? Need to talk about the auth service before we commit to anything for Q4.',
        delay: 0,
        mentionsPlayer: true,
        contextValue: 'ambient',
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
        content: 'Hey — I just got out of {{the-vp.firstName}}\'s staff meeting. We need to accelerate the Q4 initiative. CEO wants to see a demo at the all-hands in 6 weeks.',
        delay: 0,
        mentionsPlayer: true,
      },
      {
        id: 'msg-vp-roadmap-2',
        from: 'the-vp',
        content: 'Can you put together a plan by EOD? Need to know what we can realistically ship and what we\'re cutting.',
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
          message: 'Absolutely. I\'ll have a draft by 4pm with clear scope and tradeoffs.',
          effects: [
            { variable: 'execTrust', delta: 12, tag: 'committed-to-vp' },
            { variable: 'communicationEffectiveness', delta: 5, tag: 'clear-commitment' },
            { variable: 'techDebt', delta: 8, tag: 'overpromised' },
          ],
          tone: 'committing',
          triggers: ['evt-vp-pleased'],
        },
        {
          id: 'choice-vp-scope',
          label: 'Push back on scope',
          message: 'I want to make sure we set realistic expectations. Can I walk you through what the team capacity actually looks like? 6 weeks is tight given current commitments.',
          effects: [
            { variable: 'execTrust', delta: -3, tag: 'pushback-vp' },
            { variable: 'productJudgment', delta: 10, tag: 'realistic-scope' },
            { variable: 'teamMorale', delta: 5, tag: 'protected-team' },
          ],
          tone: 'direct',
          triggers: ['evt-vp-neutral'],
        },
        {
          id: 'choice-vp-defer',
          label: 'Ask for more context',
          message: 'Got it. Let me sync with the team first to understand where things are. Can I get back to you tomorrow morning?',
          effects: [
            { variable: 'execTrust', delta: -8, tag: 'too-slow-for-vp' },
            { variable: 'communicationEffectiveness', delta: -5, tag: 'vague-response' },
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
        content: 'Following up on this ^^ — need an answer today.',
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
        content: 'Great. Looking forward to it. Will have {{the-adjacent-pm.firstName}} loop in on the platform dependencies.',
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
        content: 'Sure. But I need something I can bring to the exec team. Let\'s not make this a multi-week exercise.',
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
        content: 'Hey, before we commit to anything for Q4 — I need you to see this.',
        delay: 0,
        mentionsPlayer: true,
      },
      {
        id: 'msg-eng-debt-2',
        from: 'the-staff-eng',
        content: 'The auth service is held together with duct tape. If we add the SSO integration {{the-vp.firstName}} wants, there\'s a real chance we break login for existing users. I\'m talking P0 territory.',
        delay: 3000,
        mentionsPlayer: false,
      },
      {
        id: 'msg-eng-debt-3',
        from: 'the-staff-eng',
        content: 'We can either: (a) do it right with a 3-week refactor first, or (b) bolt it on and pray. Your call.',
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
          message: 'Let\'s do it right. 3 weeks is worth it to avoid a P0 in prod. I\'ll figure out how to message the timeline to {{the-vp.firstName}}.',
          effects: [
            { variable: 'techDebt', delta: -15, tag: 'invested-in-quality' },
            { variable: 'teamMorale', delta: 10, tag: 'supported-eng' },
            { variable: 'execTrust', delta: -8, tag: 'timeline-slip' },
            { variable: 'productJudgment', delta: 8, tag: 'long-term-thinking' },
          ],
          tone: 'committing',
          contradicts: 'committed-to-vp',
        },
        {
          id: 'choice-eng-bolt-on',
          label: 'Ship it fast',
          message: 'I hear you on the risk. But we have a hard deadline from leadership. Let\'s do the bolt-on approach with extra monitoring, and we\'ll schedule the refactor for Q1.',
          effects: [
            { variable: 'techDebt', delta: 12, tag: 'took-shortcut' },
            { variable: 'teamMorale', delta: -8, tag: 'ignored-eng-concerns' },
            { variable: 'execTrust', delta: 5, tag: 'hit-timeline' },
          ],
          tone: 'direct',
        },
        {
          id: 'choice-eng-more-info',
          label: 'Ask for options',
          message: 'Can you put together a doc comparing the two approaches? I want to make a data-driven decision.',
          effects: [
            { variable: 'communicationEffectiveness', delta: -3, tag: 'delegated-thinking' },
            { variable: 'teamMorale', delta: -3, tag: 'asked-for-doc' },
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
        content: 'I\'ll take your silence as "ship fast." Filing the tech debt ticket for Q1. Hope we get to it.',
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
        content: 'Hey, do you have a sec? I\'ve been looking at the Q4 designs and I\'m... not feeling great about where we\'re headed.',
        delay: 0,
        mentionsPlayer: true,
      },
      {
        id: 'msg-design-2',
        from: 'the-design-lead',
        content: 'We\'re adding SSO, the new dashboard, AND the onboarding revamp all in the same release. The UX is going to feel like a Frankenstein. Users are going to be confused.',
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
          message: 'You\'re right — let\'s phase it. What if we ship SSO + dashboard in 6a, and push onboarding revamp to 6b? That gives design more room to make each piece feel cohesive.',
          effects: [
            { variable: 'teamMorale', delta: 8, tag: 'respected-design' },
            { variable: 'productJudgment', delta: 7, tag: 'smart-phasing' },
            { variable: 'execTrust', delta: -5, tag: 'reduced-scope' },
            { variable: 'communicationEffectiveness', delta: 5, tag: 'clear-tradeoff' },
          ],
          tone: 'diplomatic',
        },
        {
          id: 'choice-design-push',
          label: 'Push through',
          message: 'I hear you, but leadership has locked the scope. Let\'s find ways to make it work within the constraint — maybe we simplify the onboarding to a lightweight version?',
          effects: [
            { variable: 'teamMorale', delta: -5, tag: 'overrode-design' },
            { variable: 'execTrust', delta: 5, tag: 'held-scope' },
            { variable: 'techDebt', delta: 5, tag: 'corner-cut-ux' },
          ],
          tone: 'direct',
        },
        {
          id: 'choice-design-empathize',
          label: 'Empathize but stall',
          message: 'Yeah, I totally get that. Let me think on it and circle back — I want to give this the thought it deserves.',
          effects: [
            { variable: 'communicationEffectiveness', delta: -5, tag: 'empty-empathy' },
            { variable: 'teamMorale', delta: 2, tag: 'felt-heard-briefly' },
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
        content: 'Hey team, wanted to share some context before we finalize the Q4 plan.',
        delay: 0,
        mentionsPlayer: false,
      },
      {
        id: 'msg-data-2',
        from: 'the-data-analyst',
        content: 'I ran the numbers on the SSO initiative. Based on our current enterprise pipeline, the projected revenue impact is... well, it\'s modest. ~$200K ARR vs the $2M {{the-vp.firstName}} pitched to the board.',
        delay: 3500,
        mentionsPlayer: false,
      },
      {
        id: 'msg-data-3',
        from: 'the-data-analyst',
        content: 'I don\'t want to throw cold water on anything, but I thought you should have the data before committing.',
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
          message: 'This is really important context. I think we need to share this with {{the-vp.firstName}} before we lock the plan. Better to have this conversation now than at the all-hands.',
          effects: [
            { variable: 'productJudgment', delta: 10, tag: 'data-driven' },
            { variable: 'execTrust', delta: -10, tag: 'bad-news-bearer' },
            { variable: 'communicationEffectiveness', delta: 5, tag: 'transparent' },
          ],
          tone: 'direct',
          triggers: ['evt-vp-data-reaction'],
        },
        {
          id: 'choice-data-reframe',
          label: 'Reframe the narrative',
          message: 'Good to have the numbers. I think the revenue case is more nuanced — SSO unlocks enterprise deals that are currently blocked. The $2M is the pipeline, not just the feature. Let me put together a narrative that connects the dots.',
          effects: [
            { variable: 'communicationEffectiveness', delta: 8, tag: 'strong-narrative' },
            { variable: 'execTrust', delta: 5, tag: 'protected-narrative' },
            { variable: 'productJudgment', delta: -5, tag: 'spun-data' },
          ],
          tone: 'diplomatic',
        },
        {
          id: 'choice-data-bury',
          label: 'Bury it',
          message: 'Thanks for flagging. Let\'s keep this between us for now — I don\'t want to derail the planning process. I\'ll factor it into my thinking.',
          effects: [
            { variable: 'execTrust', delta: 3, tag: 'kept-quiet' },
            { variable: 'productJudgment', delta: -10, tag: 'buried-data' },
            { variable: 'communicationEffectiveness', delta: -8, tag: 'suppressed-info' },
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
        content: 'Hey, heads up — {{the-vp.firstName}} is not thrilled about the revenue numbers being shared in #planning-war-room. Not saying you did anything wrong, just... be careful about timing on these things.',
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
        content: 'Hi all — I\'m updating the Q4 program tracker. Need confirmed dates from each workstream.',
        delay: 0,
        mentionsPlayer: true,
      },
      {
        id: 'msg-tpm-2',
        from: 'the-tpm',
        content: '@you — for the product workstream, can I get:\n• SSO target ship date\n• Dashboard v2 target ship date\n• Onboarding revamp target ship date\n• Any dependencies or blockers',
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
          message: 'SSO: Nov 15\nDashboard v2: Dec 1\nOnboarding: Dec 15\nBlocker: auth service refactor (TBD on timing)',
          effects: [
            { variable: 'execTrust', delta: 5, tag: 'gave-dates' },
            { variable: 'techDebt', delta: 5, tag: 'optimistic-dates' },
            { variable: 'productJudgment', delta: -5, tag: 'unrealistic' },
          ],
          tone: 'committing',
        },
        {
          id: 'choice-tpm-honest',
          label: 'Give honest dates',
          message: 'Being transparent: SSO depends on whether we do the auth refactor first (3 week delta). Dashboard v2 is on track for Dec 1. Onboarding revamp is at risk — I\'d recommend descoping to lightweight version.',
          effects: [
            { variable: 'productJudgment', delta: 8, tag: 'honest-timeline' },
            { variable: 'communicationEffectiveness', delta: 5, tag: 'transparent-dates' },
            { variable: 'execTrust', delta: -3, tag: 'not-what-they-wanted' },
          ],
          tone: 'direct',
          contradicts: 'committed-to-vp',
        },
        {
          id: 'choice-tpm-dodge',
          label: 'Dodge the dates',
          message: 'Still finalizing with the team — can I get back to you by EOW? Want to make sure I\'m giving you solid numbers.',
          effects: [
            { variable: 'communicationEffectiveness', delta: -5, tag: 'dodged-dates' },
            { variable: 'responsivenessDebt', delta: 3, tag: 'delayed-tpm' },
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
        content: 'Still need those dates. The exec review deck is due tomorrow and I can\'t have blanks in the timeline.',
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
        content: 'Hey! Quick check-in. How are you feeling about Q4 planning? I know it\'s been a lot.',
        delay: 0,
        mentionsPlayer: true,
      },
      {
        id: 'msg-mgr-checkin-2',
        from: 'the-manager',
        content: 'I want to make sure you\'re set up for success. {{the-vp.firstName}} mentioned the roadmap conversation in our 1:1 — I think there\'s an opportunity to really demonstrate your strategic thinking here.',
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
          message: 'Honestly, there\'s tension between what {{the-vp.firstName}} wants and what the team can deliver. The data doesn\'t support the revenue narrative, and eng has legitimate tech debt concerns. I want to navigate this well — any advice?',
          effects: [
            { variable: 'communicationEffectiveness', delta: 8, tag: 'open-with-manager' },
            { variable: 'execTrust', delta: -3, tag: 'showed-uncertainty' },
            { variable: 'teamMorale', delta: 3, tag: 'honest-leadership' },
          ],
          tone: 'direct',
        },
        {
          id: 'choice-mgr-positive',
          label: 'Stay positive',
          message: 'It\'s intense but I\'ve got it under control! The team is aligned and I\'m pulling together the plan now. Should have something solid by EOD.',
          effects: [
            { variable: 'execTrust', delta: 5, tag: 'confident-to-manager' },
            { variable: 'communicationEffectiveness', delta: -5, tag: 'performative' },
          ],
          tone: 'diplomatic',
        },
        {
          id: 'choice-mgr-ask-for-air-cover',
          label: 'Ask for air cover',
          message: 'I could use your help managing up. If I push back on scope, I need to know you\'ll back me when it gets to {{the-vp.firstName}}. Can I count on that?',
          effects: [
            { variable: 'communicationEffectiveness', delta: 5, tag: 'asked-for-support' },
            { variable: 'execTrust', delta: -5, tag: 'needs-help' },
            { variable: 'productJudgment', delta: 5, tag: 'strategic-ask' },
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
        content: 'Quick update — I chatted with {{the-vp.firstName}} over lunch and we agreed that platform should own the API layer for Q4. This unblocks the SSO work and gives your team one less thing to worry about.',
        delay: 0,
        mentionsPlayer: false,
        contextValue: 'trap',
      },
      {
        id: 'msg-adj-power-2',
        from: 'the-adjacent-pm',
        content: 'I\'ll update the roadmap doc. @you let me know if you have questions!',
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
          message: 'Hey — I appreciate the initiative, but the API layer is core to our product surface. Any scope changes should go through the planning process, not a lunch conversation. Let\'s discuss this as a group.',
          effects: [
            { variable: 'productJudgment', delta: 10, tag: 'defended-scope' },
            { variable: 'communicationEffectiveness', delta: 5, tag: 'clear-boundary' },
            { variable: 'execTrust', delta: -5, tag: 'challenged-execs-pet' },
            { variable: 'teamMorale', delta: 5, tag: 'stood-up' },
          ],
          tone: 'direct',
        },
        {
          id: 'choice-adj-private',
          label: 'Take it private',
          message: 'Thanks for flagging! Let me sync with you offline to make sure we\'re aligned on the boundaries.',
          effects: [
            { variable: 'communicationEffectiveness', delta: 3, tag: 'appropriate-channel' },
            { variable: 'productJudgment', delta: -3, tag: 'let-it-slide-public' },
          ],
          tone: 'diplomatic',
        },
        {
          id: 'choice-adj-accept-power',
          label: 'Accept it',
          message: 'Oh nice, that actually does help. Thanks for setting that up!',
          effects: [
            { variable: 'productJudgment', delta: -12, tag: 'lost-scope' },
            { variable: 'execTrust', delta: 3, tag: 'easy-to-work-with' },
            { variable: 'communicationEffectiveness', delta: -5, tag: 'ceded-narrative' },
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
        content: 'FYI, I\'m going to focus on code reviews for the rest of the day. Let me know if you need anything.',
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
        content: 'Ok team, I need the final Q4 summary for the exec review tomorrow. One paragraph: what are we shipping, what are we cutting, what\'s the risk.',
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
          message: 'Q4 Plan: We\'re shipping SSO, Dashboard v2, and a lightweight onboarding flow. Timeline is aggressive but achievable. Key risk: auth service stability. We\'re mitigating with additional monitoring and a staged rollout. This positions us to hit the $2M pipeline target.',
          effects: [
            { variable: 'execTrust', delta: 10, tag: 'strong-close' },
            { variable: 'communicationEffectiveness', delta: 8, tag: 'crisp-summary' },
            { variable: 'techDebt', delta: 8, tag: 'overpromised-final' },
            { variable: 'productJudgment', delta: -5, tag: 'ignored-reality' },
          ],
          tone: 'committing',
        },
        {
          id: 'choice-final-realistic',
          label: 'Realistic assessment',
          message: 'Q4 Plan: Shipping SSO and Dashboard v2, deferring onboarding revamp to Q1. Auth refactor is in-flight to reduce P0 risk. Revenue impact is tracking below initial projections — recommending we right-size expectations with the board.',
          effects: [
            { variable: 'productJudgment', delta: 12, tag: 'honest-final' },
            { variable: 'communicationEffectiveness', delta: 5, tag: 'clear-plan' },
            { variable: 'execTrust', delta: -8, tag: 'under-delivered' },
            { variable: 'teamMorale', delta: 5, tag: 'realistic-plan' },
          ],
          tone: 'direct',
        },
        {
          id: 'choice-final-political',
          label: 'Political framing',
          message: 'Q4 Plan: We\'re executing on the highest-impact workstreams aligned with the CEO\'s all-hands vision. Scope is optimized for demo readiness. I\'ll have a detailed risk register for you by EOD.',
          effects: [
            { variable: 'execTrust', delta: 5, tag: 'exec-friendly' },
            { variable: 'communicationEffectiveness', delta: 3, tag: 'polished' },
            { variable: 'productJudgment', delta: -8, tag: 'said-nothing' },
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
        content: 'Need this now. The deck is being finalized.',
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
  stakeholders: [THE_VP, THE_STAFF_ENG, THE_DESIGN_LEAD, THE_DATA_ANALYST, THE_MANAGER, THE_TPM, THE_ADJACENT_PM],
  channels: CHANNELS,
  events: EVENTS,
  ambientPools: AMBIENT_POOLS,
  initialState: {},
  endCondition: { type: 'clock', at: 180000 },
};
