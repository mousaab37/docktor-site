// One shared list for the header, the mobile menu and the footer.
// Links start with "/#" so they also work from /blog pages.
export const sectionLinks = [
  { href: "/#about", label: "نبذة" },
  { href: "/#services", label: "الخدمات" },
  { href: "/#how", label: "كيف تحجز" },
  { href: "/#clinics", label: "العيادات" },
  { href: "/#articles", label: "المقالات" },
  { href: "/#contact", label: "تواصل" },
] as const;
