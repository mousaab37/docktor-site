// SAMPLE — replaced by Supabase queries in Phase 2.
// Everything here is fictional. Some rows are inactive or unpublished on purpose,
// so the filtering in data.ts is really tested.
import type {
  Article,
  Certificate,
  Clinic,
  ClinicWithHours,
  Faq,
  Service,
  Statistic,
  Testimonial,
  Weekday,
  WorkingHour,
} from "./types";

const TS = "2026-01-01T00:00:00Z";
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const sampleStatistics: Statistic[] = [
  { id: uid(1), label: "سنوات الخبرة (مثال)", value: "12", description: null, display_order: 1, is_active: true, created_at: TS, updated_at: TS },
  { id: uid(2), label: "مريض تمت رعايته (مثال)", value: "3500", description: null, display_order: 2, is_active: true, created_at: TS, updated_at: TS },
  { id: uid(3), label: "عيادات (مثال)", value: "2", description: null, display_order: 3, is_active: true, created_at: TS, updated_at: TS },
  // Inactive: must never be shown.
  { id: uid(4), label: "إحصائية مخفية (مثال)", value: "99", description: null, display_order: 4, is_active: false, created_at: TS, updated_at: TS },
];

export const sampleCertificates: Certificate[] = [
  { id: uid(11), title: "بكالوريوس الطب والجراحة", issuing_organization: "جامعة المثال (مثال)", issue_date: "2008-06-01", description: null, image_path: "/img/doc-ellison.webp", display_order: 1, is_active: true, created_at: TS, updated_at: TS },
  { id: uid(12), title: "زمالة طب الأسرة", issuing_organization: "الهيئة المثال للتخصصات (مثال)", issue_date: "2013-09-01", description: null, image_path: "/img/doc-okafor.webp", display_order: 2, is_active: true, created_at: TS, updated_at: TS },
  { id: uid(13), title: "دورة الرعاية الوقائية", issuing_organization: "مستشفى المثال (مثال)", issue_date: "2016-03-01", description: null, image_path: "/img/doc-haddad.webp", display_order: 3, is_active: true, created_at: TS, updated_at: TS },
  { id: uid(14), title: "دورة إدارة الأمراض المزمنة", issuing_organization: "معهد المثال (مثال)", issue_date: "2019-11-01", description: null, image_path: "/img/doc-aoki.webp", display_order: 4, is_active: true, created_at: TS, updated_at: TS },
  // Inactive: must never be shown.
  { id: uid(15), title: "شهادة مخفية", issuing_organization: "جهة المثال (مثال)", issue_date: null, description: null, image_path: null, display_order: 5, is_active: false, created_at: TS, updated_at: TS },
];

/** Builds the weekly hours of one clinic. 0 = Sunday ... 6 = Saturday. */
function hours(clinicId: string, base: number, saturdayOpen: boolean): WorkingHour[] {
  const rows: WorkingHour[] = [];
  let n = base;
  const add = (weekday: Weekday, open: string | null, close: string | null, order: number) =>
    rows.push({
      id: uid(n++),
      clinic_id: clinicId,
      weekday,
      opening_time: open,
      closing_time: close,
      is_closed: open === null,
      interval_order: order,
      created_at: TS,
      updated_at: TS,
    });
  add(0, "09:00", "17:00", 1); // Sunday
  add(1, "09:00", "13:00", 1); // Monday: two intervals
  add(1, "16:00", "20:00", 2);
  add(2, "09:00", "17:00", 1); // Tuesday
  add(3, "09:00", "17:00", 1); // Wednesday
  add(4, "09:00", "14:00", 1); // Thursday
  add(5, null, null, 1); // Friday: closed
  if (saturdayOpen) add(6, "10:00", "14:00", 1);
  else add(6, null, null, 1);
  return rows;
}

const clinicA: Clinic = {
  id: uid(21),
  name: "عيادة المثال - الرياض",
  address: "شارع المثال، حي المثال، الرياض (عنوان تجريبي)",
  phone: "+963 944 000 001",
  whatsapp: "963944000001",
  latitude: 24.7136,
  longitude: 46.6753,
  description: "عيادة تجريبية للعرض فقط.",
  is_active: true,
  created_at: TS,
  updated_at: TS,
};

const clinicB: Clinic = {
  id: uid(22),
  name: "مركز المثال الطبي - شمال الرياض",
  address: "طريق المثال، حي المثال الشمالي، الرياض (عنوان تجريبي)",
  phone: "+963 944 000 002",
  whatsapp: "963944000002",
  latitude: 24.7743,
  longitude: 46.7386,
  description: null,
  is_active: true,
  created_at: TS,
  updated_at: TS,
};

// Inactive: must never be shown.
const clinicHidden: Clinic = {
  id: uid(23),
  name: "عيادة مخفية (مثال)",
  address: "عنوان تجريبي مخفي",
  phone: "+963 944 000 003",
  whatsapp: null,
  latitude: null,
  longitude: null,
  description: null,
  is_active: false,
  created_at: TS,
  updated_at: TS,
};

export const sampleClinics: ClinicWithHours[] = [
  { ...clinicA, working_hours: hours(clinicA.id, 100, false) },
  { ...clinicB, working_hours: hours(clinicB.id, 200, true) },
  { ...clinicHidden, working_hours: hours(clinicHidden.id, 300, false) },
];

export const sampleTestimonials: Testimonial[] = [
  { id: uid(31), display_name: "م. ع.", content: "تعامل راقٍ وشرح واضح لكل خطوة في العلاج. (نص تجريبي)", testimonial_date: "2026-01-10", is_published: true, display_order: 1, created_at: TS, updated_at: TS },
  { id: uid(32), display_name: "س. ك.", content: "وقت الانتظار قصير والعيادة نظيفة ومريحة. (نص تجريبي)", testimonial_date: "2026-01-14", is_published: true, display_order: 2, created_at: TS, updated_at: TS },
  { id: uid(33), display_name: "ن. ر.", content: "تابعت حالة والدتي المزمنة بصبر واهتمام. (نص تجريبي)", testimonial_date: null, is_published: true, display_order: 3, created_at: TS, updated_at: TS },
  { id: uid(34), display_name: "ف. ح.", content: "أجابت عن كل أسئلتي دون استعجال. (نص تجريبي)", testimonial_date: "2026-02-02", is_published: true, display_order: 4, created_at: TS, updated_at: TS },
  { id: uid(35), display_name: "أ. د.", content: "نصائح عملية للوقاية جعلت صحة أسرتنا أفضل. (نص تجريبي)", testimonial_date: "2026-02-20", is_published: true, display_order: 5, created_at: TS, updated_at: TS },
  { id: uid(36), display_name: "ل. م.", content: "تجربة مريحة من الاتصال حتى انتهاء الزيارة. (نص تجريبي)", testimonial_date: null, is_published: true, display_order: 6, created_at: TS, updated_at: TS },
  // Unpublished: must never be shown.
  { id: uid(37), display_name: "ي. ز.", content: "رأي غير منشور. (نص تجريبي)", testimonial_date: null, is_published: false, display_order: 7, created_at: TS, updated_at: TS },
];

export const sampleArticles: Article[] = [
  { id: uid(41), title: "كيف تستعد لزيارة الطبيب؟", slug: "prepare-for-doctor-visit", excerpt: "نصائح بسيطة تجعل زيارتك أكثر فائدة. (نص تجريبي)", content: "<p>هذا نص تجريبي للمقال. (نص تجريبي)</p>", featured_image: "/img/reception.webp", seo_title: null, seo_description: null, status: "published", published_at: "2026-02-01T09:00:00Z", created_at: TS, updated_at: TS },
  { id: uid(42), title: "أهمية الفحص الدوري", slug: "importance-of-checkups", excerpt: "لماذا يُنصح بالفحص الدوري حتى عند الشعور بالصحة؟ (نص تجريبي)", content: "<p>هذا نص تجريبي للمقال. (نص تجريبي)</p>", featured_image: "/img/checkup.webp", seo_title: null, seo_description: null, status: "published", published_at: "2026-02-15T09:00:00Z", created_at: TS, updated_at: TS },
  { id: uid(43), title: "التغذية السليمة للأسرة", slug: "family-nutrition", excerpt: "أفكار عملية لوجبات متوازنة. (نص تجريبي)", content: "<p>هذا نص تجريبي للمقال. (نص تجريبي)</p>", featured_image: "/img/lab.webp", seo_title: null, seo_description: null, status: "published", published_at: "2026-03-01T09:00:00Z", created_at: TS, updated_at: TS },
  // Draft: must never be shown.
  { id: uid(44), title: "مسودة غير منشورة", slug: "unpublished-draft", excerpt: null, content: "<p>مسودة. (نص تجريبي)</p>", featured_image: null, seo_title: null, seo_description: null, status: "draft", published_at: null, created_at: TS, updated_at: TS },
];

export const sampleServices: Service[] = [
  { id: uid(51), title: "الكشف العام", description: "فحص وتشخيص الحالات الشائعة ووضع خطة علاج مناسبة.", image_path: "/img/gp.webp", display_order: 1, is_active: true, is_featured: true, created_at: TS, updated_at: TS },
  { id: uid(52), title: "الفحص الدوري", description: "فحوصات شاملة للاطمئنان على صحتك والكشف المبكر عن المشكلات.", image_path: "/img/checkup.webp", display_order: 2, is_active: true, is_featured: false, created_at: TS, updated_at: TS },
  { id: uid(53), title: "التحاليل المخبرية", description: "طلب التحاليل الأساسية وشرح نتائجها بوضوح.", image_path: "/img/lab.webp", display_order: 3, is_active: true, is_featured: false, created_at: TS, updated_at: TS },
  { id: uid(54), title: "الاستشارة عن بُعد", description: "استشارة طبية عن بُعد للحالات التي لا تتطلب فحصًا مباشرًا.", image_path: "/img/telehealth.webp", display_order: 4, is_active: true, is_featured: false, created_at: TS, updated_at: TS },
  { id: uid(55), title: "التحويل للتخصصات", description: "تحويل الحالات التي تحتاج إلى رعاية تخصصية ومتابعتها.", image_path: "/img/specialist.webp", display_order: 5, is_active: true, is_featured: false, created_at: TS, updated_at: TS },
  // Hidden: must never be shown, and never featured.
  { id: uid(56), title: "خدمة مخفية (مثال)", description: "خدمة تجريبية مخفية للتأكد من الفلترة. (نص تجريبي)", image_path: null, display_order: 6, is_active: false, is_featured: false, created_at: TS, updated_at: TS },
];

/** Fictional family-doctor questions, answer first. */
const faqRows: [string, string][] = [
  ["هل أحتاج موعدًا مسبقًا؟", "نعم، يُفضَّل الحجز المسبق لتقليل وقت الانتظار. يمكنك مراسلتنا على واتساب لاختيار الوقت المناسب، وستتواصل معك العيادة لتأكيد الموعد."],
  ["كيف أحجز عبر واتساب؟", "اضغط زر واتساب في الموقع وستفتح رسالة جاهزة باسم العيادة التي اخترتها. أرسلها، وسنرد عليك لتأكيد الموعد. إرسال الرسالة وحده لا يعني تأكيد الموعد."],
  ["ما مدة الكشف؟", "تستغرق الزيارة العادية بين 20 و30 دقيقة تقريبًا. قد تطول قليلًا في الزيارة الأولى لأننا نراجع تاريخك الصحي بالتفصيل."],
  ["هل تستقبلون الأطفال؟", "نعم، نستقبل الأطفال والكبار وكبار السن، وطبيب الأسرة يتابع صحة العائلة كلها في مكان واحد. أخبرنا بعمر الطفل عند الحجز ليكون الموعد مناسبًا."],
  ["هل يمكن الاستشارة عن بُعد؟", "نعم، تتوفر الاستشارة عن بُعد للحالات التي لا تحتاج فحصًا مباشرًا، مثل المتابعة وقراءة التحاليل. اطلبها عبر واتساب وسنحدد معك الموعد."],
  ["ماذا أحضر معي في الزيارة الأولى؟", "أحضر هويتك وتقاريرك وتحاليلك السابقة وقائمة بالأدوية التي تستخدمها. هذه الأوراق تساعد الطبيب على فهم حالتك بسرعة ووضع خطة مناسبة."],
  // Unpublished: must never be shown.
  ["سؤال غير منشور؟", "هذا سؤال تجريبي غير منشور للتأكد من أن الفلترة تعمل بشكل صحيح. (نص تجريبي)"],
];

export const sampleFaqs: Faq[] = faqRows.map(([question, answer], i) => ({
  id: uid(61 + i),
  question,
  answer,
  display_order: i + 1,
  is_published: i < 6,
  created_at: TS,
  updated_at: TS,
}));

/** The sample SEO texts (fictional). `og_image` stays empty. */
export const sampleSeo: Record<"global" | "blog" | "privacy" | "contact", { seo_title: string; seo_description: string }> = {
  global: { seo_title: "د. سارة الأمين | طب الأسرة في الرياض", seo_description: "عيادة طب الأسرة للدكتورة سارة الأمين: رعاية صحية شاملة لك ولعائلتك. بيانات تجريبية." },
  blog: { seo_title: "المقالات الصحية | د. سارة الأمين", seo_description: "مقالات صحية مبسّطة يكتبها الطبيب لمرضاه. بيانات تجريبية." },
  privacy: { seo_title: "سياسة الخصوصية | د. سارة الأمين", seo_description: "كيف نتعامل مع بياناتك عند التواصل معنا. بيانات تجريبية." },
  contact: { seo_title: "تواصل مع د. سارة الأمين", seo_description: "واتساب وهاتف وبريد ومواعيد العيادات. بيانات تجريبية." },
};
