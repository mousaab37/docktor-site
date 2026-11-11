import { clinicsWord } from "./arabic";

// One shared list for the header, the mobile menu and the footer.
// Links start with "/#" so they also work from /blog pages.
// The clinics label depends on how many clinics are visible ("العيادة" for one).
export function getSectionLinks(clinicCount: number) {
  return [
    { href: "/#about", label: "نبذة" },
    { href: "/#services", label: "الخدمات" },
    { href: "/#how", label: "كيف تحجز" },
    { href: "/#clinics", label: clinicsWord(clinicCount) },
    { href: "/#articles", label: "المقالات" },
    { href: "/#contact", label: "تواصل" },
  ] as const;
}
