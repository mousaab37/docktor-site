import type { ContentRepo } from "../repo/types";
import type { SectionKey } from "../types";
import { sectionVisibilityInput } from "../validation/section";

/** Handles `intent=section-visibility` (Zod checks the key and the value). Returns true when it was saved. */
export async function saveSectionVisibility(repo: ContentRepo, fd: FormData): Promise<boolean> {
  const parsed = sectionVisibilityInput.safeParse({ key: fd.get("key"), visible: fd.has("visible") });
  if (!parsed.success) return false;
  await repo.sections.set(parsed.data.key, parsed.data.visible);
  return true;
}

/** Arabic names of the sections, and where "معاينة" leads on the public site (null: nothing to preview). */
export const SECTION_INFO: Record<SectionKey, { label: string; preview: string | null; tab: string | null }> = {
  statistics: { label: "الإحصائيات", preview: "/#stats", tab: "/dashboard/statistics" },
  services: { label: "الخدمات", preview: "/#services", tab: "/dashboard/services" },
  faq: { label: "الأسئلة الشائعة", preview: "/#faq", tab: "/dashboard/faq" },
  certificates: { label: "الشهادات", preview: "/#certificates", tab: "/dashboard/certificates" },
  clinics: { label: "العيادات", preview: "/#clinics", tab: "/dashboard/clinics" },
  testimonials: { label: "آراء المرضى", preview: "/#testimonials", tab: "/dashboard/testimonials" },
  blog: { label: "المدونة", preview: "/blog", tab: "/dashboard/blog" },
  how_to_book: { label: "كيف تحجز", preview: "/#how", tab: null },
  band: { label: "الشريط المتحرك", preview: null, tab: null },
};
