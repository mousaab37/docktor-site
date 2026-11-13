import type { APIRoute } from "astro";
import { doctorConfig } from "@/config";
import { getPublishedArticles } from "@/lib/data";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// The home page, the blog, the privacy page and every published article (drafts never appear).
export const GET: APIRoute = async () => {
  const base = doctorConfig.site.url;
  const abs = (path: string) => new URL(path, base).href;
  const articles = await getPublishedArticles();
  const urls = [
    `<url><loc>${esc(abs("/"))}</loc></url>`,
    `<url><loc>${esc(abs("/blog"))}</loc></url>`,
    `<url><loc>${esc(abs("/contact"))}</loc></url>`,
    `<url><loc>${esc(abs("/privacy"))}</loc></url>`,
    ...articles.map(
      (a) => `<url><loc>${esc(abs(`/blog/${a.slug}`))}</loc><lastmod>${esc(a.updated_at)}</lastmod></url>`,
    ),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
