# Backlog

Deferred work worth remembering. Each item should be self-contained enough to pick up cold.

## Marketing & user capture

- [ ] **Email marketing platform sync** — Wire the intro-screen email capture to a marketing platform (TBD: ConvertKit / Substack / Mailchimp / Loops). Currently captured client-side only with no destination. Decide platform, set up API integration, handle errors gracefully so a failed sync doesn't block entry into the game.
- [ ] **Marketing consent checkbox** — Add an opt-in checkbox to the intro-screen email form (`design-explorations/intro-screen.html`, eventually ported to the React app). Default unchecked. Make explicit consent required before piping the email to any external marketing platform. Copy should be plain-English, not legalese.

## Gameplay

- [ ] **Ask-for-context decision branch** — When the VP asks for a Q4 plan, the player may not have enough scope context to commit. Real PMs ask clarifying questions. Currently the engine treats hesitation as deferral and penalizes it. Add an authored branch that lets the player buy time without losing execTrust. Sketch: new choice `ask-for-context` on the VP decision (tone: gathering), -1 execTrust + +productJudgment, VP responds "Fine. 30 min. Don't make me regret it.", unlocks early DMs from Sam (Staff Eng) and Pat (Manager) with scope context. If player commits within the buffer, no penalty; if they overrun, hard penalty.
- [ ] **Procedural-world content expansion** — `ScenarioWorldTemplate` framework is in. q4-planning ships with single-entry pools today. Expand the company name / team name / predecessor context pools to 4-5 entries each so each playthrough feels distinct. Consider varying the richer fields (productDescription, stage) at the template-pool level too if we want deeper variation.

## Tooling

- [ ] **Seed-deterministic narrative eval harness** — Need to be able to review generated dialogue offline without playing through. Build a script (`scripts/eval-narrative.ts`) that takes a seed + scenario + sample player inputs and dumps real Anthropic API outputs to a fixture file. Use for prompt regression checks. Requires `ANTHROPIC_API_KEY` in `.env.local`.

## Docs

- [ ] **Refresh CLAUDE.md and AGENTS.md** — Both still describe Phase 1–4 only. They don't mention `src/narrative/`, the world context system, voice register fields on stakeholders, the `#channel` click-through affordance, or the procedural-world template framework. Test count is wrong (says 33, actually 85+).
