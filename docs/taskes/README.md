# Task list

The builder does **one task at a time, in order**. Each task ends with one commit and a `taskN-result.md` file (see `AGENTS.md` §8–9).

Before task 1, the owner must:
1. Create the git repo in `Doctor site` and push it if you want a remote.
2. Make one first commit of the current files, for example `git add -A && git commit -m "initial: averin template + PRD + docs"`. This way `git status` is clean when task 1 starts.

## Phase 1 — Foundation (public landing page, static data)

| # | File | What it delivers | Status |
|---|---|---|---|
| 1 | [task1.md](task1.md) | Packages, Cloudflare adapter, Tailwind wiring, TS config, env example | ✅ done (reviewed) |
| 2 | [task2.md](task2.md) | `doctor.config.ts` + Zod schema (onboarding data) | todo |
| 3 | [task3.md](task3.md) | Arabic fonts, design tokens, base CSS, `BaseLayout`, dev style guide | todo |
| 4 | [task4.md](task4.md) | Public layout: header, mobile menu, footer, WhatsApp helper, motion script | todo |
| 5 | [task5.md](task5.md) | Data types + sample data; landing page part 1 (hero, about, stats, services); old template moved to `reference/` | todo |
| 6 | [task6.md](task6.md) | Landing page part 2 (clinics + map + hours, certificates, testimonials, articles, contact) | todo |

## Known baseline check errors (accepted until task 5)

`npm run check` reports **exactly 5 errors**, all in the old template:
- `src/components/SectionHeader.astro:43`
- `src/components/SectionVisit.astro:15–18`

The message is `ts(2322) boolean is not assignable to string`. Don't fix them. For tasks 2–4, the check counts as **passed** when these 5 are the only errors. Task 5 moves those files to `reference/` (excluded in `tsconfig.json`), after which the check must report **0 errors**.

## Backlog for later phases
- Add `wrangler.jsonc` (name, compatibility_date, `nodejs_compat`, cron trigger) when deployment and the health-check worker are set up. Build and dev work without it for now.

Phase 2 (Supabase + auth), Phase 3 (dashboard) and later phases are written after Phase 1 results are reviewed.
