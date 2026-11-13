import type { APIRoute } from "astro";
import { doctorConfig } from "@/config";
import {
  getActiveClinicsWithHours,
  getActiveServices,
  getProfile,
  getPublishedArticles,
  getPublishedFaqs,
} from "@/lib/data";
import { formatTime, groupHours, weekdayNames } from "@/lib/hours";
import { waLink } from "@/lib/whatsapp";

// llms.txt (https://llmstxt.org): a plain-text summary for AI assistants.
// Only public data: active clinics and services, published FAQs and articles. No drafts, no hidden items.
export const GET: APIRoute = async () => {
  const base = doctorConfig.site.url;
  const abs = (path: string) => new URL(path, base).href;
  const [profile, clinics, services, faqs, articles] = await Promise.all([
    getProfile(),
    getActiveClinicsWithHours(),
    getActiveServices(),
    getPublishedFaqs(),
    getPublishedArticles(),
  ]);
  const name = `${profile.honorific} ${profile.full_name}`;

  const hoursText = (c: (typeof clinics)[number]) =>
    groupHours(c.working_hours)
      .map((d) => `${weekdayNames[d.weekday]}: ${d.closed ? "مغلق" : d.intervals.map((iv) => `${formatTime(iv.from)} - ${formatTime(iv.to)}`).join(" و ")}`)
      .join("، ");

  const out: string[] = [];
  out.push(`# ${name} — ${profile.specialty}`, "");
  out.push(`> ${profile.short_intro}`, "");

  out.push("## نبذة", "");
  out.push(profile.short_intro);
  for (const e of profile.education) out.push(`- ${e.degree}، ${e.institution}${e.year ? ` (${e.year})` : ""}`);
  for (const e of profile.experience) out.push(`- ${e.role}، ${e.place} (${e.period})`);
  out.push("");

  const active = services.filter((s) => s.is_active);
  if (active.length) {
    out.push("## الخدمات", "");
    for (const s of active) out.push(`- ${s.title}: ${s.description}`);
    out.push("");
  }

  if (clinics.length) {
    out.push("## العيادات", "");
    for (const c of clinics) {
      out.push(`### ${c.name}`);
      out.push(`- العنوان: ${c.address}`);
      out.push(`- ساعات العمل: ${hoursText(c)}`);
      const phone = c.phone ?? profile.phone;
      if (phone) out.push(`- الهاتف: ${phone}`);
      out.push("");
    }
  }

  if (faqs.length) {
    out.push("## الأسئلة الشائعة", "");
    for (const f of faqs) out.push(`### ${f.question}`, f.answer.replace(/\r?\n/g, " "), "");
  }

  if (articles.length) {
    out.push("## المقالات", "");
    for (const a of articles) out.push(`- [${a.title}](${abs(`/blog/${a.slug}`)})${a.excerpt ? `: ${a.excerpt}` : ""}`);
    out.push("");
  }

  out.push("## التواصل", "");
  out.push(`- واتساب: ${waLink(profile.whatsapp, profile.whatsapp_default_message)}`);
  if (profile.phone) out.push(`- الهاتف: ${profile.phone}`);
  if (profile.email) out.push(`- البريد: ${profile.email}`);
  out.push(`- صفحة التواصل: ${abs("/contact")}`);
  out.push("- رسالة واتساب لا تعني تأكيد الموعد. ستتواصل معك العيادة لتأكيد الموعد.", "");

  return new Response(out.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
