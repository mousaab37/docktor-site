import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "http://localhost:4321",
  output: "server",
  adapter: cloudflare(),
  vite: { plugins: [tailwindcss()] },
});
