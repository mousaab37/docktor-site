import { clinicsWord } from "./arabic";

// One shared list for the header, the mobile menu and the footer.
// Section links start with "/#" so they also work from other pages; "المقالات" and "تواصل" are their own pages.
// The clinics label depends on how many clinics are visible ("العيادة" for one).
export function getSectionLinks(clinicCount: number) {
  return [
    { href: "/#about", label: "نبذة" },
    { href: "/#services", label: "الخدمات" },
    { href: "/#how", label: "كيف تحجز" },
    { href: "/#clinics", label: clinicsWord(clinicCount) },
    { href: "/blog", label: "المقالات" },
    { href: "/contact", label: "تواصل" },
  ] as const;
}

/** True for the link of the page that is open now: /blog and /blog/... , and /contact. Anchors on "/" are never "current". */
export function isCurrentLink(href: string, pathname: string): boolean {
  if (href.startsWith("/#")) return false;
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === href || path.startsWith(`${href}/`);
}
