// Supabase variables (SUPABASE_URL, SUPABASE_KEY) are declared in astro.config.mjs with astro:env.
declare namespace App {
  interface Locals {
    supabase?: import("@supabase/supabase-js").SupabaseClient;
    user?: import("@supabase/supabase-js").User | null;
    /** The public sections that are visible; loaded once per request by the middleware (public pages only). */
    sections?: import("./lib/types").SiteSections;
  }
}

interface ImportMetaEnv {
  readonly SITE_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
