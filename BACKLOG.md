# Backlog

Deferred work worth remembering. Each item should be self-contained enough to pick up cold.

## Marketing & user capture

- [ ] **Email marketing platform sync** — Wire the intro-screen email capture to a marketing platform (TBD: ConvertKit / Substack / Mailchimp / Loops). Currently captured client-side only with no destination. Decide platform, set up API integration, handle errors gracefully so a failed sync doesn't block entry into the game.
- [ ] **Marketing consent checkbox** — Add an opt-in checkbox to the intro-screen email form (`design-explorations/intro-screen.html`, eventually ported to the React app). Default unchecked. Make explicit consent required before piping the email to any external marketing platform. Copy should be plain-English, not legalese.
