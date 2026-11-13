import type { APIRoute } from "astro";
import { doctorConfig } from "@/config";

export const GET: APIRoute = () => {
  const base = doctorConfig.site.url;
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /dashboard",
    "Disallow: /login",
    "Disallow: /dev",
    `Sitemap: ${new URL("/sitemap.xml", base).href}`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
