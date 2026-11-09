# Task 10 — Login, logout, protected dashboard shell

## Goal
The doctor can log in with email and password, see an empty dashboard frame with **exactly the 8 sections**, and log out. Anyone who isn't the logged-in doctor gets redirected to `/login`, checked on the **server**.

## Before you start
- Task 9 is done, and the owner has created the doctor user and added its UID to `dashboard_users` (setup guide steps 5–6).
- Read the official `@supabase/ssr` guide for **Astro** (server client with cookies). Use `createServerClient` with `cookies.getAll` / `setAll`, built on `parseCookieHeader` and `serializeCookieHeader` or `Astro.cookies.set`.

## Files

### 1. `src/lib/supabase/server.ts`
```ts
export function createSupabaseServerClient(ctx: { request: Request; cookies: AstroCookies }): SupabaseClient
```
- Uses `createServerClient` from `@supabase/ssr` with the public URL and anon key.
- Cookie options: `httpOnly: true`, `secure: import.meta.env.PROD`, `sameSite: "lax"`, `path: "/"`.

### 2. `src/env.d.ts`
Add `App.Locals`:
```ts
declare namespace App {
  interface Locals {
    supabase: import("@supabase/supabase-js").SupabaseClient;
    user: import("@supabase/supabase-js").User | null;
  }
}
```

### 3. `src/middleware.ts`
Add an **auth step** before the cache step from task 9, combined with `sequence()`:
- Only for paths starting with `/dashboard`, `/login` or `/logout`:
  - Create the server client and put it on `locals.supabase`.
  - Call `const { data: { user } } = await supabase.auth.getUser()`. **Not** `getSession()`, which doesn't verify the token on the server.
  - When there is a user, also check `await supabase.rpc("is_dashboard_user")`. If it's `false`, sign them out and treat them as no user.
  - Set `locals.user`.
- `/dashboard*` with no user → `redirect("/login?next=" + encodeURIComponent(pathname))`.
- `/login` with a user → `redirect("/dashboard")`.
- Every other path: do nothing. Public pages must not create a session client.

### 4. `src/pages/login.astro`
- Uses `BaseLayout` with `noindex`. Simple, centered and mobile-friendly, in Arabic, with the template style: logo, title "تسجيل الدخول", email and password fields in the original `.fl` style, a primary button "دخول", and a back link to the site.
- **POST to the same page** (an Astro form handler in the frontmatter, `if (Astro.request.method === "POST")`):
  1. Validate with Zod: an email, and a password of 8–200 characters.
  2. `signInWithPassword`.
  3. On success: check `is_dashboard_user`. If it's false, sign out and show the generic error.
  4. Redirect to `next`, but only if it starts with `/dashboard`; otherwise go to `/dashboard`.
- The error message is generic for all failures: "البريد الإلكتروني أو كلمة المرور غير صحيحة". Never reveal which one was wrong.
- Keep the typed email after an error, and never the password.
- No "sign up" and no "forgot password" link (out of scope; the owner resets passwords in Supabase).

### 5. `src/pages/logout.ts`
- `POST` only. Call `signOut()`, then redirect to `/login`. A `GET` returns 405.

### 6. Dashboard shell
- `src/layouts/DashboardLayout.astro`: `BaseLayout` with `noindex`.
  - Desktop: a right-side sidebar (RTL), using the forest color, with the logo.
  - Mobile: a top bar with a menu button that opens the same list as a drawer.
  - The nav lists **exactly these 8 items, in this order**, with the current item highlighted:

  | Label | Path |
  |---|---|
  | لوحة التحكم | `/dashboard` |
  | الإحصائيات | `/dashboard/statistics` |
  | الشهادات | `/dashboard/certificates` |
  | العيادات | `/dashboard/clinics` |
  | ساعات العمل | `/dashboard/hours` |
  | المدونة | `/dashboard/blog` |
  | آراء المرضى | `/dashboard/testimonials` |
  | إعدادات SEO | `/dashboard/seo` |

  - Footer of the sidebar: the user's email, a "عرض الموقع" link to `/` (new tab), and a logout `<form method="post" action="/logout">` button "تسجيل الخروج".
  - **No** `CompareButton` on dashboard pages, and no public header or footer.
- Pages: `src/pages/dashboard/index.astro` plus the 7 section pages. Each one shows only its Arabic title and the line "قيد الإنشاء — المرحلة 3". Phase 3 builds them.
- Put the nav list in `src/lib/dashboard-nav.ts`.

## Acceptance criteria
- [ ] Logged out: `/dashboard` and `/dashboard/blog` redirect to `/login?next=…`. Check with `curl -I` too, so the server-side redirect is proven, not just JS.
- [ ] Wrong password → the generic error; the email is kept.
- [ ] Right password → `/dashboard`. The sidebar shows exactly 8 items, and every page opens.
- [ ] `next=/dashboard/clinics` → after login you land there. `next=https://evil.example` → you land on `/dashboard`.
- [ ] Logout (POST) → `/login`, and `/dashboard` redirects again.
- [ ] A user who **isn't** in `dashboard_users` can't enter. To test it, temporarily create a second user in Supabase without adding it to the table, then delete it. Mention the test in the result file.
- [ ] Dashboard and login responses carry `Cache-Control: private, no-store`.
- [ ] Mobile 375px: the login page and the dashboard drawer work.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit: `task10: auth (login, logout, middleware), dashboard shell with 8 sections`.

## Out of scope
- No CRUD forms (Phase 3). No password reset. No sign-up.
