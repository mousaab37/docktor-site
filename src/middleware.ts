import { defineMiddleware, sequence } from "astro:middleware";
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
    response = await next();
  }
  // Private pages and redirects must never be cached.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
});

export const onRequest = sequence(auth);
