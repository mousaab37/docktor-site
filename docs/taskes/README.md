# Task list

The builder does **one task at a time, in order**. Each task ends with one commit and a `taskN-result.md` file (see `AGENTS.md` §8–9).

Before task 1, the owner must:
1. Create the git repo in `Doctor site` and push it if you want a remote.
2. Make one first commit of the current files, for example `git add -A && git commit -m "initial: averin template + PRD + docs"`. This way `git status` is clean when task 1 starts.

## Phase 1 — Foundation (public landing page, static data)

| # | File | What it delivers | Status |
|---|---|---|---|
| 1 | [task1.md](task1.md) | Packages, Cloudflare adapter, Tailwind wiring, TS config, env example | ✅ done (reviewed) |
| 2 | [task2.md](task2.md) | `doctor.config.ts` + Zod schema (onboarding data) | ✅ done (reviewed) |
| 3 | [task3.md](task3.md) | Arabic fonts, design tokens, base CSS, `BaseLayout`, dev style guide | ✅ done (reviewed) |
| 4 | [task4.md](task4.md) | Public layout: header, mobile menu, footer, WhatsApp helper, basic motion (+ `/dev/reference` = original site) | ✅ done (reviewed) |
| 5 | [task5.md](task5.md) | Floating compare button old ↔ new; fix the 5 baseline errors; **full animation engine** (roll, mega menu, parallax, drift, fill words, sticky steps, marquee, clip) | todo |
| 6 | [task6.md](task6.md) | Types + sample data; landing part 1 (hero, statement + stats, services, about) | todo |
| 7 | [task7.md](task7.md) | Landing part 2 (how-to-book steps, band, certificates, clinics + map + hours, testimonials, articles, contact) | todo |

**Owner's priority:** match the original's **animations and simplicity**. Every animation is listed in [animation-inventory.md](animation-inventory.md). The original site stays available at `/dev/reference` (dev only), with a floating button to switch. The old template files are **kept**, not moved.

**Owner feedback loop:** when the owner finds something in the original that the Arabic site lacks, the planner adds a fix task (`taskNa.md`) or amends the next task.

## Known baseline check errors (accepted until task 5)

> This is the section that task files mean by "see `README.md`": `docs/taskes/README.md`, not the root README.

`npm run check` reports **exactly 5 errors**, all in the old template:
- `src/components/SectionHeader.astro:43`
- `src/components/SectionVisit.astro:15–18`

The message is `ts(2322) boolean is not assignable to string`. Don't fix them. For tasks 2–4, the check counts as **passed** when these 5 are the only errors. Task 5 fixes them (`alt` → `alt=""`), after which the check must report **0 errors**.

## Backlog for later phases
- Add `wrangler.jsonc` (name, compatibility_date, `nodejs_compat`, cron trigger) when deployment and the health-check worker are set up. Build and dev work without it for now.

Phase 2 (Supabase + auth), Phase 3 (dashboard) and later phases are written after Phase 1 results are reviewed.
