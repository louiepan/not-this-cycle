# Not This Cycle

A 5-minute web-based simulation game that parodies being a Product Manager at a big tech company. The interface simulates a Slack workspace. Players receive escalating cross-functional pings, make decisions under ambiguity, and receive a satirical performance review at the end.

Sharp satire, psychologically accurate. Silicon Valley tone.

## Tech Stack

- Next.js 16 + TypeScript + React 19
- Tailwind CSS v4
- Vitest for testing
- No backend for MVP (client-side only, analytics stub)
- Vercel deployment target

## Architecture

One-way data flow: `GameEngine → useGameSession hook → React Components`

The engine is pure TypeScript with zero React dependencies. It's deterministic and testable. Content is separated from logic via `ContentProvider` abstraction (MVP uses `StaticContentProvider`, v2 will swap in `AIContentProvider` for LLM-generated messages).

### Key Directories

- `src/engine/` — Pure TypeScript game engine (GameEngine, StateManager, EventScheduler, EscalationManager, RatingEngine, ContentProvider, SeededRandom)
- `src/engine/__tests__/` — Engine unit + integration tests (33 tests, all passing)
- `src/hooks/` — React hooks bridging engine to UI (`useGameSession` for game state/lifecycle, `useGameClock` for tick loop with tab visibility pause)
- `src/components/slack/` — Slack-themed UI components (Workspace, Sidebar, ChannelView, Message, MessageGroup, MessageComposer, Avatar, TypingIndicator, UnreadBanner)
- `src/components/game/` — Game flow components (AcceptOfferScreen, DifficultySelect)
- `src/components/review/` — Review screen component (ReviewScreen)
- `src/content/scenarios/` — Scenario data files (q4-planning.ts is the MVP scenario)
- `src/analytics/` — Client-side event tracking (tracker + event types)
- `src/app/api/analytics/` — Analytics API route (console.log stub for MVP)

### Game Engine

- **6 hidden variables**: `execTrust`, `communicationEffectiveness`, `teamMorale`, `productJudgment`, `techDebt`, `responsivenessDebt` — all clamped 0-100
- **`productJudgment`** tracks whether decisions aligned with embedded truths in the scenario. The review never confirms which calls were "right" — just like real life.
- **Conviction** is computed post-game from decision patterns (defer count, position contradictions). It modifies review commentary but doesn't affect composite score.
- **Composite score** = weighted sum of variables, mapped to 5 calibration buckets (Needs Improvement → Strongly Exceeds)
- **9 archetypes** detected from variable patterns (The Shield, The Cassandra, The Bulldozer, etc.) with "The Survivor" as fallback
- **Calibration outcome never gives a promotion** — only escalating "maybe next cycle" language with increasingly specific excuses

### Escalation System

- Decisions have timeouts scaled by stakeholder `patience` trait
- Ignoring a decision triggers escalation: original choices are replaced with worse, more polarized options
- Most decisions: 1 escalation stage + auto-resolve. Only 2-3 key decisions get multi-stage.
- Cross-stakeholder escalation exists (ignoring one person can trigger another)

### Stakeholder Model

- 7 MVP stakeholders with two-layer personality: MBTI + Enneagram for authoring depth, mechanical traits (`patience`, `persistence`, `conflictStyle`, `escalationPattern`) for the engine
- `StakeholderTemplate` with name pools for replayability (same personality, different name each playthrough)
- Personality types are invisible to the player — felt, never labeled

### Difficulty System

Three levels: Junior PM / Senior PM / Principal PM. Scales `timingScale`, `escalationTimeoutScale`, `ambientNoiseLevel`, `concurrentConversations`. All levels bias toward overwhelming.

### Notification Model

Two tiers mirroring real Slack: red @mention badges (requires attention) vs. gray unread counts (ambient noise). Messages have a `context` field: `noise`, `ambient`, `optional`, `trap`.

## What's Built (Phase 1-4 complete)

- Complete game engine with all modules, all tests passing
- Full Slack-themed UI component library
- MVP scenario content (q4-planning.ts) with 7 stakeholders, 20+ events, decisions, escalations, ambient messages, peer feedback templates
- Analytics infrastructure (client tracker + API stub)
- **React hooks** (`useGameSession`, `useGameClock`) bridging engine to UI — handles game lifecycle, tick loop (100ms interval), tab visibility pause, decision submission, channel switching, typing indicators
- **Game page (`src/app/page.tsx`)** — three-phase flow: menu → playing → review. Builds peer feedback from templates using variable-based severity tiers.
- **Start screen** (`AcceptOfferScreen` + `DifficultySelect`) — email-style offer with difficulty selector and "Accept Offer" button
- **Review screen** (`ReviewScreen`) — calibration bucket, archetype, variable breakdown with progress bars, conviction metrics, manager review, per-stakeholder peer feedback, dangling promotion outcome, "Try Again" button
- **Layout metadata** — title "Not This Cycle — A PM Simulator"

## What's NOT Built Yet

- **README.md** — still default Next.js template, needs project-specific content
- **Playtesting & pacing tuning** — message timing, escalation windows, and difficulty scaling need real playthroughs to validate
- **Polish** — transitions between game phases, loading states, edge case handling
- **Deployment** — Vercel setup with custom domain (Phase 7 in plan)

## Design Constraints

- No over-engineering. No premature backend.
- Engine must stay pure and testable — no React imports in `src/engine/`.
- Content separated from logic. Provider abstraction at the boundary.
- Performance review must feel earned, not random. Commentary ties directly to player behavior via tag system.
- Peer feedback: one line per stakeholder, three severity tiers (polite, pointed, mask-off), scaling with how badly the player treated that stakeholder.
- Manager review: deliberately vague corporate language. Tags + variable ranges select templates. Never specifically calls out decisions.

## Testing

Run `npx vitest` to execute all engine tests. Currently 33 tests across 4 test files, all passing.
