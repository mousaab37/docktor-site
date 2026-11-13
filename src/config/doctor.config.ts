// SAMPLE — fictional data for development. Replace during onboarding.
import { doctorConfigSchema } from "./doctor.schema";

const raw = {
  site: {
    name: "د. سارة الأمين",
    url: "https://example.com",
    defaultTitle: "د. سارة الأمين | طب الأسرة",
    defaultDescription: "عيادة طب الأسرة للدكتورة سارة الأمين: رعاية صحية شاملة لك ولعائلتك.", // SAMPLE
    ogImage: "/img/hero.webp",
    defaultCountry: "SY" as const,
    clinicMessage: "مرحبًا، أود الاستفسار عن موعد في {clinic}",
  },
  doctor: {
    honorific: "د.",
    fullName: "سارة الأمين",
    specialty: "طب الأسرة",
    shortIntro: "رعاية صحية متكاملة لجميع أفراد الأسرة، بإصغاء واهتمام وخطة علاج واضحة.", // SAMPLE
    bio: [
      "هذه نبذة تجريبية عن الطبيبة، وهي بيانات خيالية لأغراض التطوير فقط.", // SAMPLE
      "تهتم الطبيبة بالطب الوقائي ومتابعة الأمراض المزمنة وصحة الأسرة.", // SAMPLE
    ],
    photo: { src: "/img/doc-haddad.webp", alt: "صورة الدكتورة سارة الأمين" },
    education: [
      { degree: "بكالوريوس الطب والجراحة", institution: "جامعة المثال", year: 2008 }, // SAMPLE
      { degree: "زمالة طب الأسرة", institution: "جامعة المثال", year: 2013 }, // SAMPLE
    ],
    experience: [
      { role: "استشارية طب الأسرة", place: "مستشفى المثال", period: "2014 – 2019" }, // SAMPLE
      { role: "طبيبة أسرة", place: "مستشفى المثال", period: "2019 – الآن" }, // SAMPLE
    ],
    languages: ["العربية", "الإنجليزية"],
  },
  brand: {
    logoText: "د. سارة الأمين",
    primary: "#0B3B2E",
    accent: "#C8F23A",
  },
  contact: {
    phone: "+966 50 000 0000",
    whatsapp: "966500000000",
    email: "clinic@example.com",
    socials: [{ platform: "instagram", url: "https://instagram.com/example" }],
  },
  services: [
    {
      slug: "general-consultation",
      title: "الكشف العام",
      description: "فحص وتشخيص الحالات الشائعة ووضع خطة علاج مناسبة.",
      image: { src: "/img/gp.webp", alt: "كشف عام" },
    },
    {
      slug: "checkup",
      title: "الفحص الدوري",
      description: "فحوصات شاملة للاطمئنان على صحتك والكشف المبكر عن المشكلات.",
      image: { src: "/img/checkup.webp", alt: "فحص دوري" },
    },
    {
      slug: "lab-tests",
      title: "التحاليل المخبرية",
      description: "طلب التحاليل الأساسية وشرح نتائجها بوضوح.",
      image: { src: "/img/lab.webp", alt: "تحاليل مخبرية" },
    },
    {
      slug: "telehealth",
      title: "الاستشارة عن بُعد",
      description: "استشارة طبية عن بُعد للحالات التي لا تتطلب فحصًا مباشرًا.",
      image: { src: "/img/telehealth.webp", alt: "استشارة عن بعد" },
    },
    {
      slug: "referrals",
      title: "التحويل للتخصصات",
      description: "تحويل الحالات التي تحتاج إلى رعاية تخصصية ومتابعتها.",
      image: { src: "/img/specialist.webp", alt: "تحويل للتخصصات" },
    },
  ],
  whatsapp: {
    defaultMessage: "مرحبًا، أود الاستفسار عن موعد.",
  },
  privacy: {
    lastUpdated: "2026-01-01",
    sections: [
      {
        heading: "البيانات التي نجمعها",
        body: "لا يحتوي هذا الموقع على حسابات للمرضى ولا على نماذج لإدخال البيانات. لا نجمع منك أي بيانات شخصية عبر الموقع.",
      },
      {
        heading: "كيف نستخدمها",
        body: "إذا تواصلت معنا عبر واتساب فإننا نستخدم رسالتك للرد على استفسارك فقط، ولا نشاركها مع أي جهة أخرى.",
      },
      {
        heading: "التواصل معنا",
        body: "للاستفسار عن هذه السياسة تواصل معنا عبر الهاتف أو البريد الإلكتروني المذكورين في الموقع. رسالة واتساب لا تعني تأكيد الموعد.",
      },
    ],
  },
};

export const doctorConfig = doctorConfigSchema.parse(raw);
