import { defineConfig, envField } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "http://localhost:4321",
  output: "server",
  adapter: cloudflare(),
  vite: { plugins: [tailwindcss()] },
  // Server-only: every Supabase call runs on the server. SUPABASE_KEY is the publishable key (never the secret key).
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: "server", access: "public", url: true }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret" }),
    },
  },
});
