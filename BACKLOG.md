# Not This Cycle — Backlog

> Current backlog only. Closed items live in git history.
> Format: title, status, size (XS/S/M/L), priority, then problem/solution/notes.
> Last updated: 2026-05-16

---

## Persist player profile across sessions

**Status:** Done (2026-05-16)
**Size:** S (~half-day)
**Priority:** Medium-low (post-deploy polish, but cheap to ship anytime)

### Problem

On every replay, the player retypes their name on AcceptOfferScreen. That's friction with zero gameplay value. There's also no sense of continuity between runs — the satirical premise ("you keep showing up to performance reviews and nothing changes") goes unreinforced because the product literally forgets the player every time.

### Solution

localStorage-only persistence. No accounts, no backend, no auth.

- After first run, persist `{ playerName, lastDifficulty, runHistory[] }` to localStorage under a single key (e.g., `ntc:player:v1`).
- `runHistory` entries store: `{ id, completedAt, difficulty, archetype, calibrationBucket, scenarioId }`. **No raw score, no raw variable values** — keep the satirical opacity intact.
- Pre-fill name on AcceptOfferScreen. Show subtle "Not [Name]? Start fresh" link that clears the profile.
- On ReviewScreen, append the completed run to history before unmount.
- Optional: "Previous reviews" strip on AcceptOfferScreen showing last 3 runs (date + archetype + bucket) when history exists. Tone: dry corporate filing, not gamified.

### Non-goals (explicit)

- No accounts, no auth, no backend.
- No leaderboard, no social comparison, no public sharing.
- No cloud sync. If user clears storage, history resets. That's fine — matches the thesis: nothing about your work here is actually permanent.
- No raw scores surfaced. The whole point is you never know if you were calibrated correctly.

### Screens affected

- **AcceptOfferScreen**: pre-fill, reset link, optional history strip
- **ReviewScreen**: append-on-complete (no UI change required for v1)
- **No new screens**

### Open questions

- How many past runs to surface? Suggest last 3, with "...and N earlier reviews" if more exist.
- Privacy disclosure: a one-line note on AcceptOfferScreen is probably sufficient ("Your name and run history are stored on this device only").
- Storage versioning: include a `v1` namespace from the start so schema migrations are possible.

### Shipped notes

- `src/lib/playerProfile.ts` — schema-versioned, SSR-safe, capped at 50 runs.
- `AcceptOfferScreen` — pre-fill, "Not [Name]? Start fresh" link, "Previous Reviews on File" strip (last 3), privacy disclosure.
- `ReviewScreen` — append-on-render guarded by ref to fire exactly once per review session.
- 11 unit tests in `src/lib/__tests__/playerProfile.test.ts`. All green.

---

## Satirical Nth-review references in ReviewScreen

**Status:** Done (2026-05-16)
**Size:** S (~half-day)
**Priority:** Medium — this is the product gem hiding inside the profile feature

### Problem

Each performance review currently reads as a one-off. The satirical premise gets sharper when the review can *reference prior reviews* — "you've been here before, and nothing has changed" is a stronger joke than "here's your rating."

### Solution

Once `runHistory` is available, the ReviewScreen reads it on render and conditionally injects "continuity lines" into the manager review or a new "HR Note" section. Pure content layer — no engine changes.

### Example trigger rules and lines

- **Repeat visitor (runs >= 2)**: "This is your Nth performance review at TechCorp."
- **Three runs same bucket**: "You have received '[bucket]' three cycles in a row. HR has been notified of the pattern."
- **Archetype drift**: "Last cycle you were [previous]. This cycle you are [current]. Your manager finds this 'concerning, but not actionable.'"
- **Same archetype 3x**: "You are, once again, [archetype]. At some point this becomes who you are."
- **Promotion language escalation**: tracks how many cycles in a row the player has been told "maybe next cycle" and the excuses get more specific each time (already a designed mechanic — this just feeds the cycle count).
- **Never above midline**: "We've reviewed your tenure. There is no evidence you have ever exceeded expectations. We remain optimistic."

### Implementation notes

- Add a `continuityTemplates` module under `src/content/` (separate from scenarios).
- Selection logic lives in ReviewScreen or a small `useContinuity` hook — not in the engine. Engine stays pure.
- Cap at 1-2 continuity lines per review to avoid dilution.
- A/B in playtesting: does this make the satire land harder, or does it break immersion by being too on-the-nose?

### Non-goals

- No actual gameplay effect. Continuity is decoration, not mechanics.
- No "carry-over" of variables between runs. Each game starts fresh.

### Shipped notes

- `src/content/continuityLines.ts` — pure rules engine. Tiered priority (1=most specific, 4=least), category dedupe so two lines never share a theme.
- Rules implemented: 2nd-run welcome, 3rd–4th-run cadence, 5+ frequent-flyer, 3x bucket streak, 4+ bucket streak ("documenting for legal"), never-exceeded long history, all-exceeding-no-promotion, 3x same archetype, archetype drift, difficulty up/down.
- Cap of 2 lines per review.
- Rendered in `ReviewScreen` as a yellow "HR — Continuing Notes" panel at top of the review-commentary column.
- 12 unit tests in `src/content/__tests__/continuityLines.test.ts`. All green.

### Followups (not shipping now)

- Playtest in real session sequences to confirm the lines land. Tune wording if any feel forced.
- Consider adding rules for: variable-pattern continuity (e.g., always low team morale), peer-feedback callbacks ("Sarah's feedback this cycle reads identically to her last three").

---

## Pacing and difficulty playtest tuning

**Status:** Backlog
**Size:** M
**Priority:** High (pre-deploy)

### Problem

Per CLAUDE.md: message timing, escalation windows, and difficulty scaling need real playthroughs to validate. The numbers were authored, not tested.

### Solution

Structured playtests across all three difficulty levels. Track: completion rate, average decisions ignored, ambient-message overwhelm threshold, "felt unfair" moments. Tune `timingScale`, `escalationTimeoutScale`, `ambientNoiseLevel`, `concurrentConversations` per level.

### Open questions

- Who plays? Other PMs (highest signal but small pool), or wider audience?
- Telemetry needed beyond current analytics tracker?

---

## Refresh CLAUDE.md and AGENTS.md

**Status:** Backlog
**Size:** XS
**Priority:** Medium

### Problem

Both files still describe Phase 1-4 only. No mention of `src/narrative/` (narrative AI layer landed 2026-03-26: provider adapters, model routing, API routes, cost telemetry).

### Solution

One pass adding narrative architecture section, updated "what's built," updated directory listing.

---

## Phase-transition polish

**Status:** Backlog
**Size:** S-M
**Priority:** Medium (pre-deploy)

### Problem

Transitions between menu → playing → review are abrupt. No loading states, no easing. The game's emotional arc deserves more deliberate connective tissue.

### Solution

Design first (Claude Design or sketch), then implement. Key moments:
- Accept Offer → Workspace materializes (first ping should feel earned)
- Workspace → Review (cut to black or "End of Day" beat before review reveals)
- Review → Try Again (acknowledge the loop you're entering)

---

## Vercel deployment

**Status:** Backlog
**Size:** S
**Priority:** High (ship blocker)

### Problem

Phase 7 in original plan. Not yet started.

### Solution

Vercel project, custom domain, analytics endpoint promoted from stub to real route, env vars for narrative API keys.

---
