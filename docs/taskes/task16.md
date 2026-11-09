# Task 16 — Login and logout: replace the dev gate with real auth

## Goal
The dashboard built in tasks 8–14 becomes private. Only the doctor, logged in **and** listed in `dashboard_users`, can open it, checked on the **server**. After this task, `/dashboard` also works in production. The data still comes from the in-memory repo; task 17 switches it to Supabase.

## Before you start
- Tasks 8–15 are done.
- The owner has a **dev Supabase project** set up with `db/README.md` (01-setup, the doctor user, 02-add-doctor, 03-check all green), and `.env` has `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`. If not, stop and report it.
- Read the official `@supabase/ssr` guide for **Astro** (`createServerClient` with `cookies.getAll` / `setAll`).

## Files

### 1. `src/lib/supabase/server.ts`
```ts
export function createSupabaseServerClient(ctx: { request: Request; cookies: AstroCookies }): SupabaseClient
```
- Cookie options: `httpOnly: true`, `secure: import.meta.env.PROD`, `sameSite: "lax"`, `path: "/"`.

### 2. `src/env.d.ts`
Add:
```ts
declare namespace App {
  interface Locals {
    supabase?: import("@supabase/supabase-js").SupabaseClient;
    user?: import("@supabase/supabase-js").User | null;
  }
}
```

### 3. `src/middleware.ts`
Replace the task 8 **dev gate** step with an **auth** step (keep `sequence()` and the no-store header):
- Only for paths starting with `/dashboard`, `/login` or `/logout`:
  - Create the server client and set `locals.supabase`.
  - Call `auth.getUser()`. **Never** rely on `getSession()` alone.
  - When there is a user, call `rpc("is_dashboard_user")`. If it returns `false` → `signOut()` and treat them as no user.
  - Set `locals.user`.
- `/dashboard*` with no user → `redirect("/login?next=" + encodeURIComponent(pathname + search))`.
- `/login` with a user → `redirect("/dashboard")`.
- Public paths: do nothing. **Don't** create a session client for them.
- Remove the `import.meta.env.DEV` 404 rule for `/dashboard`, because auth now protects it.

### 4. `src/pages/login.astro`
- `BaseLayout` with `noindex`. Centered and mobile-friendly, in Arabic, matching the dashboard style: logo, "تسجيل الدخول", email, password (with a show/hide toggle button), and a "دخول" button.
- POST handler in the frontmatter:
  1. Validate with Zod (an email; a password of 8–200 characters).
  2. `signInWithPassword`.
  3. On success, check `is_dashboard_user`. If false → sign out and show the generic error.
  4. Redirect to `next` **only if it starts with `/dashboard`**; otherwise go to `/dashboard`.
- One generic error for every failure: "البريد الإلكتروني أو كلمة المرور غير صحيحة". Keep the email; never re-fill the password.
- No sign-up link and no reset link. The owner resets passwords in Supabase.

### 5. `src/pages/logout.ts`
`POST` only → `signOut()` → redirect to `/login`. Any other method → 405.

### 6. `DashboardLayout.astro`
- Remove the yellow "dev mode" banner, **or** change its text to "البيانات مؤقتة حتى ربط قاعدة البيانات (المهمة 17)" while the memory repo is still in use.
- Sidebar footer: the user's email (`Astro.locals.user.email`) and a logout form (`<form method="post" action="/logout">`) with a "تسجيل الخروج" button.

## Acceptance criteria
- [ ] Logged out: `curl -I http://localhost:4321/dashboard/blog` → `302` to `/login?next=%2Fdashboard%2Fblog`. This proves the check runs on the server.
- [ ] Wrong password → the generic error; the email is kept.
- [ ] Right password → `/dashboard`, and every section works as before.
- [ ] `next=/dashboard/clinics` → you land there. `next=https://evil.example` and `next=//evil.example` → you land on `/dashboard`.
- [ ] Logout → `/login`. Going back to `/dashboard` redirects again.
- [ ] A user **not** in `dashboard_users` can't get in. Create one temporarily in Supabase, test, then delete it. Mention the test in the result file.
- [ ] `npm run build && npm run preview`: `/dashboard` → redirects to login. It doesn't return 404 anymore.
- [ ] `/login` and `/dashboard` responses carry `Cache-Control: private, no-store`.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit: `task16: login, logout, server-side dashboard protection`.

## Out of scope
Switching data to Supabase (task 17). Password reset. Sign-up.
