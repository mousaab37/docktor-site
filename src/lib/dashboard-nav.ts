// The dashboard has exactly these 9 sections (AGENTS.md §4). Do not add more.
// `icon` is the inner markup of a 24x24 stroke SVG.
export interface DashboardNavItem {
  label: string;
  path: string;
  icon: string;
}

export const dashboardNav: DashboardNavItem[] = [
  {
    label: "لوحة التحكم",
    path: "/dashboard",
    icon: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  },
  {
    label: "ملفي",
    path: "/dashboard/profile",
    icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  },
  {
    label: "خدماتي",
    path: "/dashboard/services",
    icon: '<path d="M12 21s-8-4.9-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.1-8 11-8 11z"/>',
  },
  {
    label: "الإحصائيات",
    path: "/dashboard/statistics",
    icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  },
  {
    label: "الشهادات",
    path: "/dashboard/certificates",
    icon: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5"/>',
  },
  {
    label: "العيادات",
    path: "/dashboard/clinics",
    icon: '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  },
  {
    label: "المدونة",
    path: "/dashboard/blog",
    icon: '<path d="M5 3h10l4 4v14H5z"/><path d="M9 12h6M9 16h6M9 8h3"/>',
  },
  {
    label: "آراء المرضى",
    path: "/dashboard/testimonials",
    icon: '<path d="M4 5h16v11H9l-5 4z"/>',
  },
  {
    label: "إعدادات SEO",
    path: "/dashboard/seo",
    icon: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.5-4.5"/>',
  },
];
