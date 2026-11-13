import type { APIRoute } from "astro";
import { doctorConfig } from "@/config";

// AI answer engines are allowed on purpose: being cited by them is part of the product.
// The doctor can switch any of them off later by changing "Allow" to "Disallow" below.
const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "PerplexityBot", "Google-Extended", "Applebot-Extended"];
const PRIVATE = ["/dashboard", "/login", "/dev", "/api"];

export const GET: APIRoute = () => {
  const base = doctorConfig.site.url;
  const lines = [
    "User-agent: *",
    "Allow: /",
    ...PRIVATE.map((p) => `Disallow: ${p}`),
    "",
    "# AI crawlers: allowed. The doctor can turn any of them off later.",
    ...AI_CRAWLERS.flatMap((bot) => [`User-agent: ${bot}`, "Allow: /", ...PRIVATE.map((p) => `Disallow: ${p}`), ""]),
    `Sitemap: ${new URL("/sitemap.xml", base).href}`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
