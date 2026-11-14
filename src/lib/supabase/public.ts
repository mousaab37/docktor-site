// The cookie-less anon client for the public pages: RLS shows only active and published rows.
// One client per isolate. Returns null when the variables are missing.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSecret, SUPABASE_URL } from "astro:env/server";

let client: SupabaseClient | null | undefined;

export function getPublicClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const key = getSecret("SUPABASE_KEY");
  client =
    SUPABASE_URL && key ? createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}
