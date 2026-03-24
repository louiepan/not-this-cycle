# Not This Cycle
A PM simulator where the prize for surviving Slack is a performance review that still somehow ends with "maybe next cycle."

**Not This Cycle** is a web-based satire game about being a Product Manager at a large tech company. The whole thing plays inside a fake Slack workspace: engineering wants fewer surprises, leadership wants more urgency, GTM wants a date, and everyone would prefer that you solve their problem first.

You make decisions under ambiguity, juggle escalating cross-functional pings, absorb ambient workplace nonsense, and eventually receive a calibration write-up built from how you handled the chaos. It is meant to be funny, mildly painful, and a little too recognizable.

On the surface, it is a satire about planning season, stakeholder management, and the ambient absurdity of being a PM at a large tech company. Underneath, it is also a product-systems exercise in how structured simulation and model-generated language can work together: keeping outcomes legible and testable while using AI where tone, realism, and variation actually improve the experience.

## What It Is

- A short browser game with a Slack-style interface
- A satire of PM life, prioritization theater, and corporate ambiguity
- A deterministic simulation with replayable stakeholder dynamics
- A fake performance review generator with real emotional damage

## Why It’s Fun

- Messages escalate if you ignore them, which means procrastination is fully modeled as a gameplay mechanic
- Hidden variables track things like exec trust, team morale, product judgment, and various forms of debt
- Stakeholders have distinct personalities, pressure styles, and escalation patterns
- The ending gives you calibration language, peer feedback, and the exact kind of non-promotion wording your nervous system already recognizes

## Current State

The current build is a playable client-side MVP with one complete scenario, a full Slack-style interface, escalating stakeholder threads, difficulty levels, ambient noise, freeform player replies, analytics hooks, and an end-of-game review that turns your behavior into calibration language.

Under the hood, the architecture is intentionally split into a deterministic simulation core and a React UI shell:

- `GameEngine -> useGameSession -> React components` keeps state flowing in one direction
- `EventScheduler`, `EscalationManager`, `StateManager`, and `RatingEngine` each own a narrow part of the simulation instead of collapsing everything into one giant game loop
- The engine is pure TypeScript and has zero React dependencies, so timing, escalations, scoring, and replay logic stay testable
- A seeded randomness layer gives the game replay variety without turning it into chaos
- Scenario content is already abstracted behind a `ContentProvider`, with `StaticContentProvider` powering the MVP and leaving a clean seam for an `AIContentProvider`
- Freeform player text is currently interpreted locally through tone and keyword matching, then mapped back onto authored choices so the game can stay structured while still feeling conversational
- The review system computes a weighted composite score, conviction metrics, and PM archetypes from hidden variables and decision patterns instead of picking random flavor text
- The React bridge runs on a 100ms game clock and pauses when the tab loses visibility so the player does not return to a completely destroyed quarter

For the current milestone, the game stays local and deterministic so the pressure model, pacing, and Slack-like interaction design can be tuned against a stable simulation. That creates a cleaner foundation for selectively introducing server-backed generation later, in places where better language quality would materially change the feel of the game.

This means the game already has the part that matters most for production: a stable source of truth. The simulation decides what is happening. Content is a layer on top of it, not the other way around.

## Production Architecture

The launch version is designed as a hybrid system: deterministic game state for fairness and pacing, API-based LLM generation for realism, voice, and replayability.

### Core Principle

The LLM does **not** decide whether your quarter went well. The engine does.

The engine remains authoritative for:

- event scheduling
- escalation timers
- hidden variable updates
- difficulty scaling
- decision resolution
- final review scoring

The model layer is there to make the experience feel more human: more believable Slack messages, more varied stakeholder phrasing, sharper reactions, and more specific end-of-cycle commentary.

### Multi-Tier LLM Strategy

To keep inference costs sane, the production design uses a multi-tier model stack instead of sending every message to the biggest model:

The product question is not whether to generate everything; it is where generation earns its keep. Routine state transitions remain deterministic, narrower interpretation tasks go to cheaper models, and higher-end generation is reserved for moments where better writing meaningfully changes the player experience.

1. **Deterministic engine layer**
   Handles all simulation logic, branching, scoring, and safety rails at near-zero cost.
2. **Small/cheap model layer**
   Used for narrow tasks like classifying player intent, extracting reply signals, selecting a tone, summarizing recent context, and routing requests to the right content generation path.
3. **High-quality generation layer**
   Reserved for moments where realism really matters: executive escalations, especially sharp stakeholder replies, reactive rewrites, and the final performance review package.

That gives the game the expensive feeling of bespoke dialogue without paying premium model prices for every ambient ping in `#proj-q4-planning`.

### Planned Launch Flow

A production request path would look roughly like this:

1. The deterministic engine advances the game and decides that a stakeholder message, escalation, or review artifact needs to be produced.
2. A server-side orchestration layer builds a structured prompt from canonical state: scenario facts, stakeholder traits, prior thread history, current hidden variables, difficulty, and the exact gameplay constraint for that turn.
3. A lightweight model handles cheap interpretation work first when possible, such as player-intent classification or compact thread summarization.
4. A larger model is called only when the game needs high-fidelity prose.
5. The response is validated against a schema and normalized back into engine-safe content objects before it reaches the client.

In other words: the model improvises the dialogue, but the engine still owns the rules of the universe.

### Why This Architecture Matters

- The current `ContentProvider` abstraction makes it straightforward to swap static authored content for API-backed generation without rewriting the simulation
- Freeform replies can evolve from heuristic matching into model-assisted intent parsing while still resolving to canonical choice IDs and effect tags
- Stakeholder personalities can stay mechanically consistent because their traits live in structured data, while the LLM only turns those traits into language
- The same architecture supports caching and replay determinism: store prompt inputs, model tier, and normalized outputs, then rehydrate sessions or analyze runs later
- It supports pre-generation and buffering, so the game can hide model latency behind typing indicators, queued events, and ambient channel noise
- It creates a nice cost/quality tradeoff surface: cheap models for classification, premium models only where the player will actually notice the difference

### Production Constraints We Want

- API-based generation, not fully client-side generation
- Structured outputs validated before they affect gameplay
- Aggressive caching for repeated ambient content and similar stakeholder turns
- Fallback to authored templates if model output fails validation or latency spikes
- Strict separation between simulation state and generated prose so the game stays debuggable

The goal is a game that feels alarmingly real without turning into an expensive, nondeterministic chatbot.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Vitest

The front end is intentionally lightweight. The interesting part is the engine architecture: a pure TypeScript simulation layer, hook-based UI bridge, and content boundary designed for a future API-backed AI system.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run tests with:

```bash
npm test
```
