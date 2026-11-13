import { FilterXSS } from "xss";

const escapeAttr = (v: string) => v.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Whitelist only: any tag or attribute that is not listed here is removed (no DOM needed, so it runs on Workers).
const none: string[] = [];
const filter = new FilterXSS({
  whiteList: {
    p: none, h2: none, h3: none, strong: none, em: none, u: none, s: none,
    ul: none, ol: none, li: none, blockquote: none, br: none, hr: none,
    a: ["href"], // the only attribute that survives; no style, class or on* handlers anywhere
  },
  stripIgnoreTag: true, // unknown tags go, their text stays
  stripIgnoreTagBody: ["script", "style"], // these go with their content
  safeAttrValue: (tag, name, value) =>
    tag === "a" && name === "href" && /^(https?:|mailto:|tel:)/i.test(value.trim()) ? escapeAttr(value.trim()) : "",
});

/** Cleans article HTML. Run it before saving and again before rendering. */
export function sanitizeArticleHtml(html: string): string {
  return filter
    .process(html)
    .replace(/<a href(?:="")?>/g, "<a>") // a link whose address was refused
    .replace(/<a href=/g, '<a rel="noopener nofollow" target="_blank" href=');
}
