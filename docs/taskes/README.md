# Task list

The builder does **one task at a time, in order**. Each task ends with one commit and a `taskN-result.md` file (see `AGENTS.md` §8–9).

## Workflow (from task 10 on): one branch + one Pull Request per task
1. **Builder:** `git pull` main → branch `task/N-name` → work → commit → push the branch → open the PR, or print the compare link when `gh` isn't installed.
2. **Planner:** reviews the branch (code + browser check) and writes the verdict: accept, or a fix task `taskNb.md`.
3. **Owner:** clicks **Merge** on GitHub.
4. **Planner:** pulls `main`, marks the task done here, and pushes that **docs-only** commit straight to `main`. Docs never go through a PR.

Tasks 1–9a were committed straight to `main`, before this workflow existed.

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
| 7a | [task7a.md](task7a.md) | Fix: map traps page scroll on mobile (two-finger pan) | ✅ done (`7f963ab`) |

## Phase 2 — Dashboard first (no login, dev only, in-memory data)

The owner asked to build the dashboard **before** the database and login. Every page talks to a `ContentRepo` interface (task 8). Today it's an in-memory store seeded from `sample-data.ts`, and the landing page reads the same store, so edits show on `/` right away. `/dashboard` returns **404 in production** until login is added (task 16).

| # | File | What it delivers | Status |
|---|---|---|---|
| 8 | [task8.md](task8.md) | Validation schemas, `ContentRepo` + memory store, dev-only gate, `DashboardLayout` (8 sections), UI kit, Overview | ✅ done (reviewed) |
| 9 | [task9.md](task9.md) | Statistics + Testimonials (list/add/edit/delete/order/show-hide): the pattern every other section copies | ✅ done (reviewed) |
| 9a | [task9a.md](task9a.md) | Owner feedback: statistics + testimonials edit/add in a popup (`FormDialog`); statistic description removed | ✅ done (reviewed) |
| 10 | [task10.md](task10.md) | Certificates, with image upload inside the form (+ description field removed, owner request) | ✅ done (PR #1 merged) |
| 11 | [task11.md](task11.md) | Clinics, with the map location picker | ✅ done (PR #2 merged) |
| 11b | [task11b.md](task11b.md) | Owner feedback: address filled from the map click, coordinates hidden, one mini map per clinic on the home page, shared Leaflet code | ✅ done (PR #3 merged) |
| 11c | [task11c.md](task11c.md) | Owner feedback: address above the map, phone/WhatsApp country picker (Syria default, libphonenumber + Zod), singular "العيادة" when one clinic | ✅ done (PR #4 merged) |
| 11d | [task11d.md](task11d.md) | Owner feedback: phone fields restyled with `intl-tel-input` (flag images, Arabic search); server validation unchanged | ✅ done (PR #5 merged) |
| 12 | [task12.md](task12.md) | **Owner decision:** hours tab removed (7 sections); week hours editor inside each clinic form | ✅ PR #6 (merge pending) |
| 13 | [task13.md](task13.md) | Blog: Arabic RTL editor (Tiptap), drafts and publish, HTML sanitizer, public `/blog` + `/blog/[slug]` | todo |
| 14 | [task14.md](task14.md) | SEO settings (last section), sitemap, robots, privacy, 404, JSON-LD | todo |

## Phase 3 — Database + login (at the end, as the owner asked)

| # | File | What it delivers | Owner action needed | Status |
|---|---|---|---|---|
| — | [db/](../../db/README.md) | **Written and tested by the planner:** `01-setup.sql` (schema, RLS, storage), `02-add-doctor.sql`, `03-check.sql`, Arabic guide | Owner follows `db/README.md` per client (copy and paste, about 10 min) | ✅ ready |
| 15 | [task15.md](task15.md) | `db/90-sample-data.sql` (dev seed, same rows as `sample-data.ts`) | — | todo |
| 16 | [task16.md](task16.md) | Login/logout; server-side auth replaces the dev gate | Dev Supabase project set up with `db/README.md` + `.env` filled | todo |
| 17 | [task17.md](task17.md) | Supabase repo for public pages, dashboard writes and image Storage | Run `db/90-sample-data.sql` on the dev project | todo |
| 18 | [task18.md](task18.md) | `npm run verify:security`: 16 automated RLS/storage checks (PRD §7.4) | `.env.test.local` with the doctor's test login | todo |

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
- Health-check cron worker (PRD §13), backup and restore docs (PRD §14), deployment guide per doctor (PRD §12). These are written after Phase 3.
