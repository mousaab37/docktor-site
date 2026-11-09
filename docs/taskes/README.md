# Task list

The builder does **one task at a time, in order**. Each task ends with one commit and a `taskN-result.md` file (see `AGENTS.md` §8–9).

Before task 1, the owner must:
1. Create the git repo in `Doctor site` and push it if you want a remote.
2. Make one first commit of the current files, for example `git add -A && git commit -m "initial: averin template + PRD + docs"`. This way `git status` is clean when task 1 starts.

## Phase 1 — Foundation (public landing page, static data)

| # | File | What it delivers | Status |
|---|---|---|---|
| 1 | [task1.md](task1.md) | Packages, Cloudflare adapter, Tailwind wiring, TS config, env example | todo |
| 2 | [task2.md](task2.md) | `doctor.config.ts` + Zod schema (onboarding data) | todo |
| 3 | [task3.md](task3.md) | Arabic fonts, design tokens, base CSS, `BaseLayout`, dev style guide | todo |
| 4 | [task4.md](task4.md) | Public layout: header, mobile menu, footer, WhatsApp helper, motion script | todo |
| 5 | [task5.md](task5.md) | Data types + sample data; landing page part 1 (hero, about, stats, services); old template moved to `reference/` | todo |
| 6 | [task6.md](task6.md) | Landing page part 2 (clinics + map + hours, certificates, testimonials, articles, contact) | todo |

Phase 2 (Supabase + auth), Phase 3 (dashboard) and later phases are written after Phase 1 results are reviewed.
