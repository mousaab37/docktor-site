interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SITE_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
