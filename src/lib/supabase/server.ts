// The Supabase client of one request, for the pages that need a session (/login, /logout, /dashboard/*).
// Public pages never use it (they would not need cookies). Only the publishable key is used here, never the secret key.
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { getSecret, SUPABASE_URL } from "astro:env/server";

export function createSupabaseServerClient(ctx: { request: Request; cookies: AstroCookies }): SupabaseClient {
  // Read at request time, so a missing variable can only break the private pages.
  const key = getSecret("SUPABASE_KEY");
  if (!SUPABASE_URL || !key) throw new Error("SUPABASE_URL and SUPABASE_KEY must be set to use the dashboard");
  return createServerClient(SUPABASE_URL, key, {
    cookies: {
      getAll() {
        // `value` can be undefined in the parser's type; a cookie without a value is the same as no cookie.
        return parseCookieHeader(ctx.request.headers.get("Cookie") ?? "").map((c) => ({ name: c.name, value: c.value ?? "" }));
      },
      setAll(list) {
        for (const { name, value, options } of list) {
          ctx.cookies.set(name, value, { ...options, httpOnly: true, secure: import.meta.env.PROD, sameSite: "lax", path: "/" });
        }
      },
    },
  });
}
