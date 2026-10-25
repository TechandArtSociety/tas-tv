# How we built TAS TV in one weekend

Spec, build, review, loop. One engineer, several AIs, every step written down.

## 1. Specs first (Saturday morning)

Before any code, we wrote four documents (in French, kept as they were in [docs/specs/](specs/)):

| Document | What it fixes |
|---|---|
| [Research](specs/RESEARCH_24-7_PLATFORMS_FR.md) | What already exists for 24/7 channels (Upstream, Gyre, Lightcast, MediaTailor…), YouTube's embed rules, rights to check |
| [Architecture](specs/ARCHITECTURE_FR.md) | 10 decisions, e.g. D1 a virtual antenna (server clock + grid, no streaming server), D3 Kayo proposes and a human publishes, D6 no overlap enforced by the database, D10 networks are relays, not the source |
| [Functional spec](specs/FUNCTIONAL_SPEC_FR.md) | 25 functions (F-01 to F-25), 11 rules (R-01 only cleared rights go on air…), 8 acceptance criteria |
| [Technical spec](specs/TECHNICAL_SPEC_FR.md) | Stack, data model, API, and 7 vertical slices (T0 to T6), each with a "done when" |

## 2. Build with Codex, slice by slice (Saturday)

The brief became [AGENTS.md](../AGENTS.md), which Codex reads at every session. Codex built T0 (repo, database, synced antenna) and T1 (protected studio, library, grid, publishing). After each slice: a commit, an update of [STATUS.md](STATUS.md) with proof (tests, two tabs on the same minute, no console error), and screenshots in [docs/screenshots/](screenshots/).

## 3. Review over the shoulder

A second AI watched the work without touching the code. It read the session, the diffs and the status, and wrote instructions in a shared file, [CONSIGNES_CLAUDE.md](CONSIGNES_CLAUDE.md). Codex read it before each slice and each commit, ticked what it did, and wrote down when it disagreed. Example: it kept 1.2 GB of videos out of git before the first commit, and refused to delete a folder outside the repo because its brief kept it read-only there.

## 4. The last mile (Saturday night)

When the weekend's Codex credits ran out after T1, we finished with other models: Kayo's day planning, his announcements, house ads, the moderated live chat. Then an independent review of the code and of the OpenAI calls (checked against the official SDK sources) found real bugs (for example, proposing a new day could take the live grid off air), and we fixed them.

## 5. Loop

Every change goes back through the same loop: the spec says what "done" means, the build proves it, the review challenges it. Commits tell the story: `git log --reverse`.
