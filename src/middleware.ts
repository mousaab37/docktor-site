import { defineMiddleware, sequence } from "astro:middleware";
import { RepoError } from "@/lib/repo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PRIVATE_PREFIXES = ["/dashboard", "/login", "/logout"];
const isPrivate = (path: string) => PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

// Auth step. Only /dashboard, /login and /logout get a Supabase session client; public pages never do.
// The user is checked on the server with auth.getUser() (never getSession() alone), and must also be
// listed in dashboard_users (the is_dashboard_user() function). A logged-in user who is not listed is signed out.
const auth = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;
  if (!isPrivate(pathname)) return next();

  const supabase = createSupabaseServerClient({ request: context.request, cookies: context.cookies });
  context.locals.supabase = supabase;

  const { data } = await supabase.auth.getUser();
  let user = data.user ?? null;
  if (user) {
    const { data: allowed, error } = await supabase.rpc("is_dashboard_user");
    if (allowed !== true) {
      if (!error) await supabase.auth.signOut(); // a real "no": not listed. An error is only treated as "not logged in".
      user = null;
    }
  }
  context.locals.user = user;

  let response: Response;
  if (pathname.startsWith("/dashboard") && !user) {
    response = context.redirect("/login?next=" + encodeURIComponent(pathname + search));
  } else if (pathname === "/login" && user) {
    response = context.redirect("/dashboard");
  } else {
    try {
      response = await next();
    } catch (error) {
      if (!(error instanceof RepoError)) throw error;
      console.error("[dashboard] repo error:", error.cause ?? error);
      // A failed save goes back to the same page with a message; a failed read cannot (it would loop).
      if (context.request.method === "POST") {
        response = context.redirect(pathname + "?err=1", 303);
      } else {
        response = new Response("تعذّر تحميل البيانات، حاول مرة أخرى.", {
          status: 500,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    }
  }
  // Private pages and redirects must never be cached.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
});

// Public pages: cached at the edge for 5 minutes, and served stale for a day while they refresh.
const publicCache = defineMiddleware(async (context, next) => {
  const response = await next();
  if (
    context.request.method === "GET" &&
    !isPrivate(context.url.pathname) &&
    response.status === 200 &&
    (response.headers.get("Content-Type") ?? "").includes("text/html") &&
    !response.headers.has("Cache-Control")
  ) {
    response.headers.set("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
  }
  return response;
});

export const onRequest = sequence(auth, publicCache);
