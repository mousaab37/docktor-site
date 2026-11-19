import { clinicsWord } from "./arabic";
import type { SiteSections } from "./types";

// One shared list for the header, the mobile menu and the footer.
// Section links start with "/#" so they also work from other pages; "المقالات" and "تواصل" are their own pages.
// The clinics label depends on how many clinics are visible ("العيادة" for one).
// The link of a hidden section is left out (there would be nothing to scroll to, or a 404).
export function getSectionLinks(clinicCount: number, sections: SiteSections) {
  const all: { href: string; label: string; show: boolean }[] = [
    { href: "/#about", label: "نبذة", show: true },
    { href: "/#services", label: "الخدمات", show: sections.services },
    { href: "/#how", label: "كيف تحجز", show: sections.how_to_book },
    { href: "/#clinics", label: clinicsWord(clinicCount), show: sections.clinics },
    { href: "/#faq", label: "الأسئلة الشائعة", show: sections.faq },
    { href: "/blog", label: "المقالات", show: sections.blog },
    { href: "/contact", label: "تواصل", show: true },
  ];
  return all.filter((l) => l.show).map(({ href, label }) => ({ href, label }));
}

/** True for the link of the page that is open now: /blog and /blog/... , and /contact. Anchors on "/" are never "current". */
export function isCurrentLink(href: string, pathname: string): boolean {
  if (href.startsWith("/#")) return false;
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === href || path.startsWith(`${href}/`);
}
