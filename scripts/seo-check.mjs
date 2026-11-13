// SEO check for a running site. Usage: npm run seo:check [-- http://localhost:4321]
// Uses only fetch and regular expressions. Exits with 1 when anything fails.
const base = (process.argv[2] ?? "http://localhost:4321").replace(/\/$/, "");
let failed = 0;
const ok = (pass, label) => {
  if (!pass) failed++;
  console.log(`${pass ? "✅" : "❌"} ${label}`);
};

const get = async (path) => {
  const res = await fetch(base + path, { redirect: "follow" });
  return { status: res.status, text: await res.text() };
};
const count = (html, re) => (html.match(re) ?? []).length;
const attr = (html, re) => html.match(re)?.[1] ?? "";
const len = (s) => Array.from(s).length;

function jsonLdTypes(html) {
  const types = new Set();
  const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  if (blocks.length === 0) return { error: "no JSON-LD", types };
  for (const [, raw] of blocks) {
    try {
      const data = JSON.parse(raw);
      for (const node of data["@graph"] ?? [data]) for (const t of [].concat(node["@type"] ?? [])) types.add(t);
    } catch (e) {
      return { error: `JSON-LD does not parse (${e.message})`, types };
    }
  }
  return { error: null, types };
}

async function checkPage(label, path, expectedTypes) {
  console.log(`\n${label}  ${path}`);
  const { status, text: html } = await get(path);
  ok(status === 200, `status 200 (got ${status})`);
  ok(count(html, /<h1[\s>]/g) === 1, `exactly one h1 (found ${count(html, /<h1[\s>]/g)})`);
  const title = attr(html, /<title>([^<]*)<\/title>/);
  ok(title !== "" && len(title) <= 60, `title ≤ 60 (${len(title)}): ${title}`);
  const desc = attr(html, /<meta name="description" content="([^"]*)"/);
  ok(desc !== "" && len(desc) <= 160, `description present and ≤ 160 (${len(desc)})`);
  ok(/<link rel="canonical" href="https?:\/\/[^"?#]+"/.test(html), "canonical present");
  ok(/<meta property="og:image" content="https?:\/\//.test(html), "og:image is absolute");
  const ld = jsonLdTypes(html);
  ok(ld.error === null, ld.error ?? "JSON-LD parses");
  for (const t of expectedTypes) ok(ld.types.has(t), `JSON-LD has ${t}`);
  ok(!/noindex/.test(attr(html, /<meta name="robots" content="([^"]*)"/)), "indexable (no noindex)");
  return html;
}

const home = await checkPage("Home", "/", ["WebSite", "Physician", "MedicalClinic", "Service", "FAQPage"]);
void home;
const blog = await checkPage("Blog", "/blog", ["BreadcrumbList"]);
const slug = attr(blog, /href="(\/blog\/[a-z0-9-]+)"/);
if (slug) await checkPage("First article", slug, ["BlogPosting", "BreadcrumbList", "Physician"]);
else ok(false, "the blog lists at least one article");
await checkPage("Contact", "/contact", ["BreadcrumbList"]);

console.log("\nrobots.txt");
const robots = await get("/robots.txt");
ok(robots.status === 200, "status 200");
ok(/User-agent: GPTBot\s+Allow: \//.test(robots.text), "GPTBot is allowed");
ok(/Sitemap: https?:\/\//.test(robots.text), "sitemap line present");

console.log("\nsitemap.xml");
const sitemap = await get("/sitemap.xml");
ok(sitemap.status === 200, "status 200");
ok(slug !== "" && sitemap.text.includes(slug), "lists the article");
ok(count(sitemap.text, /<lastmod>/g) === count(sitemap.text, /<url>/g), "every URL has lastmod");

console.log("\nllms.txt");
const llms = await get("/llms.txt");
ok(llms.status === 200, "status 200");
ok(llms.text.trim().length > 0, "not empty");

const missing = await get("/this-page-does-not-exist");
console.log("");
ok(missing.status === 404, `unknown URL returns 404 (got ${missing.status})`);

console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
