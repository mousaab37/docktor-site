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
| 5 | [task5.md](task5.md) | Floating compare button old ↔ new; fix the 5 baseline errors; **full animation engine** (roll, mega menu, parallax, drift, fill words, sticky steps, marquee, clip) | ✅ done (reviewed) |
| 6 | [task6.md](task6.md) | Types + sample data; landing part 1 (hero, statement + stats, services, about) | ✅ done (reviewed) |
| 7 | [task7.md](task7.md) | Landing part 2 (how-to-book steps, band, certificates, clinics + map + hours, testimonials, articles, contact) | ✅ done (reviewed) |
| 7a | [task7a.md](task7a.md) | Fix: map traps page scroll on mobile (two-finger pan) | todo |

## Phase 2 — Database, public data, login

| # | File | What it delivers | Owner action needed | Status |
|---|---|---|---|---|
| — | [db/](../../db/README.md) | **Written and tested by the planner:** `01-setup.sql` (schema, RLS, storage), `02-add-doctor.sql`, `03-check.sql`, Arabic guide `README.md` | Owner follows `db/README.md` for each client (copy and paste, about 10 min) | ✅ ready |
| 8 | [task8.md](task8.md) | `db/90-sample-data.sql` (dev seed, same rows as `sample-data.ts`) | Owner runs it on the **dev** project only | todo |
| 9 | [task9.md](task9.md) | Landing page reads from Supabase; image URLs; graceful fallback; cache headers | `.env` must be filled first | todo |
| 10 | [task10.md](task10.md) | Login, logout, server-side protected `/dashboard` with the 8-section shell | Doctor user + `dashboard_users` row must exist | todo |
| 11 | [task11.md](task11.md) | `npm run verify:security`: 16 automated RLS/storage checks (PRD §7.4) | Create `.env.test.local` with the doctor's test login | todo |

Security model: content tables are readable by the public only when active/published. **All writes require `public.is_dashboard_user()`**, which means being logged in **and** listed in `dashboard_users`. This is protection in addition to "signups disabled".

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

- Real edge caching on Cloudflare (Workers responses aren't CDN-cached by default; `s-maxage` alone isn't enough). Decide on the Cache API or caching rules at deploy time.
- Article HTML sanitization is part of the Phase 3 blog editor task.

Phase 3 (dashboard CRUD) and later phases are written after the Phase 2 results are reviewed.
