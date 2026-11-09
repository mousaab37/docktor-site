# AGENTS.md — Doctor Website

Instructions for the coding agent working in this repo. Read this file fully before every task.

## 1. How we work

- **Planner vs. builder.** The tasks are written by a planner model in `docs/taskes/taskN.md`. You are the builder: you implement **one task file at a time**, exactly as written.
- **Do only what the task says.** Do not start the next task. Do not refactor, rename, or "improve" files the task does not list. If something outside the task is broken, write it under *Notes for planner* in the result file (see §8) instead of fixing it.
- **If the task is unclear or contradicts this file or the PRD, stop and ask** rather than guess.
- **Never delete files** unless the task says so by exact path.
- **Git is required** (see §9). One task = one commit.

## 2. Source of truth (read in this order when a task points to them)

1. `docs/taskes/taskN.md` — the current task (what to do now). Results of earlier tasks are in `docs/taskes/taskN-result.md`.
2. `AGENTS.md` — this file (rules that always apply).
3. `docs/system-design.md` — architecture, folder structure, data mapping.
4. `doctor-website-prd-v1.1.md` — product requirements (scope, security, DB tables).

If they conflict: task > AGENTS.md > system-design > PRD, **except** the hard rules in §4, which always win.

## 3. Project in one paragraph

A **simple landing page** for a single Arabic-speaking doctor, with its content controlled from a private **inner dashboard**. Arabic, right-to-left. Built as a reusable **Astro** codebase: each doctor gets their own deployment on **Cloudflare Workers** and their own **Supabase** project (Postgres, Auth, Storage).

The public site is **one landing page** (`/`) made of sections (hero, about, statistics, services, clinics and hours with map, certificates, testimonials, latest articles, contact). The header links scroll to those sections. The only other public routes are:
- `/blog` and `/blog/[slug]`, because articles need their own crawlable URLs for SEO
- `/privacy` and the 404 page
- `/login` and `/dashboard/*`, which are private

Do **not** create separate About, Services, Clinics, Booking or Contact pages. Those are sections of the landing page. The repo started as the English "Averin" clinic template (`src/components/Section*.astro`, `src/content.json`, `public/site.css`, `public/site.js`). Those files are the **visual reference** being ported to Arabic RTL; they are not the final architecture.

## 4. Hard rules (never break)

**Scope**
- The dashboard has **exactly 8 sections**: Overview, Statistics, Certificates, Clinics, Working Hours, Blog, Testimonials, SEO Settings.
- **Never add** dashboard sections for Profile, Website Settings (logo, colors, branding, contact), Media Library, or Services.
- Profile, branding, contact details and services come from `src/config/doctor.config.ts`. They are not stored in the database and not editable in the dashboard.
- No booking engine, no payments, no patient accounts, no FAQ, no prices section, no public review form.
- Contact happens through WhatsApp `wa.me` links. The site must say a WhatsApp message **does not confirm an appointment**.

**Security**
- Never put the Supabase **service-role key** in code, `.env` files read by the browser, or anything committed.
- Never commit secrets. `.env` must stay in `.gitignore`.
- Every dashboard route and action must check the Supabase session on the **server** with `auth.getUser()` (never trust `getSession()` alone) **and** `is_dashboard_user()`. Front-end checks alone are not enough.
- The database lives in `db/` (`01-setup.sql`, `02-add-doctor.sql`, `03-check.sql`, guide `README.md`). The **planner** writes and tests those files; **never edit them** unless a task says so. If the app needs a schema change, report it under *Notes for planner*.
- Every write RLS policy uses `public.is_dashboard_user()`. Never use plain `auth.role() = 'authenticated'`.
- Public pages use the cookie-less anon client (`src/lib/supabase/public.ts`); only `/login`, `/logout` and `/dashboard/*` create a session client.
- Draft articles must never be readable publicly.
- Article HTML must be sanitized before it is saved and before it is rendered.

**Content honesty**
- Never invent real-looking medical credentials, reviews or statistics. Sample data must be obviously fictional and marked `// SAMPLE` in code.

## 5. Tech stack and conventions

| Area | Use |
|---|---|
| Framework | Astro 7, `output: "server"`, adapter `@astrojs/cloudflare` |
| Language | TypeScript, strict. No `any` unless commented why |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, design tokens in `src/styles/global.css` under `@theme` |
| Validation | Zod (shared schemas in `src/lib/validation/`) |
| Data / Auth | `@supabase/supabase-js` + `@supabase/ssr` |
| Maps | Leaflet + OpenStreetMap, with attribution shown |
| Client JS | Small vanilla TS in Astro `<script>` tags. No React/Vue unless a task says so |

**RTL rules**
- `<html lang="ar" dir="rtl">` in the base layout.
- Use **logical** CSS and Tailwind utilities: `ms-* me-* ps-* pe-* start-* end-* text-start text-end border-s border-e`. Do **not** use `ml- mr- pl- pr- left- right- text-left text-right` for layout.
- Arrow and chevron icons that point "forward" must be flipped for RTL (`rtl:-scale-x-100`).
- No italic for Arabic text. Where the template used serif italic for emphasis, use the accent font or the accent color.
- Numbers, phone numbers and times inside Arabic text: wrap in `<bdi>` or `dir="ltr"` when the order could break.

**Code style**
- One component per file in `src/components/public/` or `src/components/dashboard/`.
- Props are typed with an `interface Props`.
- All user-visible text in the public site and dashboard is **Arabic**. Code, comments, file names and variable names are **English**.
- Keep pages server-rendered. Add client JS only for interaction (menus, map, editor, reveal animations).
- Respect `prefers-reduced-motion`.

## 6. Commands

```bash
npm install --fetch-timeout=600000 --fetch-retries=5   # internet is slow here; always use these flags
npm run dev        # http://localhost:4321
npm run build
npx astro check    # type check; must pass before you finish a task
```

## 7. Environment notes (Windows)

- Shell: PowerShell or Git Bash on Windows 11. Paths contain a space (`Doctor site`), so quote them.
- npm downloads are slow and sometimes time out. If an install fails with `EIDLETIMEOUT` or "Cannot find native binding":
  1. Make sure no other `npm` process is running.
  2. Make sure your shell is **not** inside `node_modules`.
  3. Delete `node_modules` and `package-lock.json`, then reinstall with the flags above.
- `@fontsource-variable/ibm-plex-sans-arabic` **does not exist**. Use `@fontsource/ibm-plex-sans-arabic`.

## 8. Finishing a task

When the task is done, **create a new file** next to the task: `docs/taskes/taskN-result.md`. Do not edit the task file itself. Use this format:

```md
# Task N — Result
- Commit: (short hash + message)
- Status: done | blocked
- Files changed: (list)
- Commands run and outcome: (npm run build ✅, npx astro check ✅ …)
- How to verify: (URL / steps)
- Notes for planner: (anything unexpected, anything left out, questions)
```

Do not mark a task `done` unless `npm run build` and `npx astro check` both pass, or the task explicitly says they are not required.

## 9. Git

- The repo is created by the owner. If `git status` says "not a git repository", stop and report it. Do not run `git init` yourself.
- Work on the `main` branch unless the task names another branch.
- Before starting, `git status` must be clean. If it isn't, stop and report what is uncommitted.
- At the end of each task, after build and type-check pass:
  ```bash
  git add -A
  git commit -m "taskN: <short summary in English>"
  git push            # only if a remote is configured (git remote -v shows one)
  ```
- The result file `docs/taskes/taskN-result.md` is part of the same commit.
- Never commit `.env`, `.dev.vars`, `node_modules/`, `dist/` or `.wrangler/`. Check `.gitignore` covers them before your first commit.
- Never use `git push --force`, `git reset --hard` or rewrite history.

## 10. Skills

- `.agents/skills/find-skills/` is installed. Use it (`npx skills find <query>`) when a task needs specialised know-how you don't have, such as Tailwind v4, Supabase RLS, Astro on Cloudflare or Leaflet. Mention any skill you installed in the result file under *Notes for planner*.
