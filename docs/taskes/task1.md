# Task 1 — Project setup (packages, adapter, Tailwind wiring, TypeScript)

## Goal
Prepare the project for the real build: install the missing packages, switch Astro to server rendering on Cloudflare, wire up Tailwind (but don't use it yet), and add strict TypeScript and env files.
**The old Averin page must still look exactly the same at the end of this task.**

## Before you start
- `git status` must be clean (AGENTS.md §9).
- Read AGENTS.md §5–7.
- Already installed (dev): `tailwindcss`, `@tailwindcss/vite`, `typescript`, `@types/leaflet`, `@astrojs/check`, `wrangler`. Don't reinstall them.

## Steps

1. **Install runtime packages** (one command, slow network flags):
   ```bash
   npm install --fetch-timeout=600000 --fetch-retries=5 @supabase/supabase-js @supabase/ssr zod leaflet @fontsource/ibm-plex-sans-arabic @fontsource/noto-naskh-arabic
   ```

2. **Add the Cloudflare adapter**:
   ```bash
   npx astro add cloudflare --yes
   ```
   Let it edit `astro.config.mjs` and create the wrangler config file it wants. If it fails because of the network, install `@astrojs/cloudflare` with the npm flags above and configure it by hand, following `node_modules/@astrojs/cloudflare/README.md`.

3. **Edit `astro.config.mjs`** so it ends up like this (keep anything the adapter added that is not listed here):
   ```js
   import { defineConfig } from "astro/config";
   import cloudflare from "@astrojs/cloudflare";
   import tailwindcss from "@tailwindcss/vite";

   export default defineConfig({
     site: "http://localhost:4321",
     output: "server",
     adapter: cloudflare(),
     vite: { plugins: [tailwindcss()] },
   });
   ```

4. **Create `src/styles/global.css`** with only this line:
   ```css
   @import "tailwindcss";
   ```
   **Do not import it anywhere yet.** Its reset would break the old page. Task 3 uses it.

5. **Create `tsconfig.json`** (replace it if one exists):
   ```json
   {
     "extends": "astro/tsconfigs/strict",
     "include": [".astro/types.d.ts", "**/*"],
     "exclude": ["dist", "reference"],
     "compilerOptions": {
       "paths": { "@/*": ["./src/*"] }
     }
   }
   ```

6. **Create `src/env.d.ts`**:
   ```ts
   interface ImportMetaEnv {
     readonly SUPABASE_URL: string;
     readonly PUBLIC_SUPABASE_ANON_KEY: string;
     readonly SITE_URL: string;
   }
   interface ImportMeta {
     readonly env: ImportMetaEnv;
   }
   ```

7. **Create `.env.example`**:
   ```
   SUPABASE_URL=
   PUBLIC_SUPABASE_ANON_KEY=
   SITE_URL=http://localhost:4321
   ```

8. **Edit `.gitignore`**: keep the existing lines and add:
   ```
   .env
   .env.*
   !.env.example
   .dev.vars
   .wrangler/
   ```

9. **Edit `package.json`**:
   - Set `"name": "doctor-website"`.
   - Add the script `"check": "astro check"`.
   - Keep the other scripts.

10. **Replace `README.md`** with a short project README:
    - Title: `Doctor Website`
    - One sentence: Arabic RTL landing page for a single doctor, managed from a private dashboard (Astro + Cloudflare Workers + Supabase).
    - "Run": the install command with the timeout flags, `npm run dev`, `npm run build`, `npm run check`.
    - "Docs": links to `doctor-website-prd-v1.1.md`, `docs/system-design.md`, `AGENTS.md`, `docs/taskes/README.md`.

## Acceptance criteria
- [ ] `npm run dev` starts, and http://localhost:4321 shows the **unchanged** English Averin page.
- [ ] `npm run build` passes.
- [ ] `npm run check` passes with 0 errors. If the old template files cause errors, **don't edit them**: report them in the result file and set Status to `blocked`.
- [ ] `git status` doesn't show `.env`, `.wrangler/` or `node_modules/`.
- [ ] One commit: `task1: project setup (cloudflare adapter, tailwind wiring, ts strict)`.

## Out of scope
- Don't change anything in `src/components/`, `src/layouts/`, `src/content.json`, `public/site.css` or `public/site.js`.
- Don't import `global.css` anywhere.
- Don't create any Supabase code.
