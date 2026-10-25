# TAS TV

**Turn it on. Don't choose.** A 24/7 channel of independent creators, programmed by humans with Kayo (the AI host of Tech & Art Society), where every viewer sees the same minute.

Built in one weekend for the OpenAI DevDay Community Hackathon, Paris (24-25 October 2026). How we worked: [docs/PROCESS.md](docs/PROCESS.md).

## What it does

- **The antenna** (`/`): a full-screen player synced to the server clock, "On air" and "Up next", the creator's credit and link always on screen, English by default with a French toggle.
- **Kayo between programs**: an announcement card before every show, house ads every three programs.
- **Live chat** under the antenna: moderated before anything shows; type `@kayo` to ask about what's on.
- **The studio** (`/studio`, password-protected): the library with rights first, the grid editor, and **"Kayo, plan the day"**, which proposes the whole day by daypart with a reason for each choice. Kayo never publishes: a human does.

## OpenAI

| Where | API |
|---|---|
| Kayo plans the day | Responses API + Structured Outputs (`lib/kayo.ts`, `lib/openai.ts`) |
| Kayo answers `@kayo` in the chat | Responses API |
| Chat moderation (Kayo's answers included) | Moderation API (`omni-moderation-latest`) |
| Building the antenna and the studio | Codex |

Every call is logged in `ai_runs` (model, tokens, prompt version). Without `OPENAI_API_KEY`, Kayo falls back to local rules and the studio says so ("Source: local rules").

## Run it

```sh
pnpm install
cp .env.example .env.local   # set STUDIO_PASSWORD and SESSION_SECRET; OPENAI_API_KEY is optional
pnpm dev                     # embedded PostgreSQL + Next.js on http://localhost:3000
```

The demo videos are not in git. With the TAS catalogue three folders up, `pnpm media:link` links them into `media/`.

## Check it

```sh
pnpm test        # includes a full 25-hour day (25 Oct, DST) laid out back to back
pnpm typecheck
pnpm lint
```

Progress, proof and known limits: [docs/STATUS.md](docs/STATUS.md) (French).

## Rights

© 2026 Tech & Art Society. All rights reserved. The code is public so the hackathon jury can read it; no license is granted to reuse it. The videos are not in this repository.
