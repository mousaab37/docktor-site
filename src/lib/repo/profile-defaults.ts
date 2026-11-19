// The onboarding values of the profile (src/config/doctor.config.ts). Used when the database row has empty fields.
import { doctorConfig } from "../../config";
import type { Profile } from "../types";

export function onboardingProfile(): Profile {
  const { doctor, contact, whatsapp } = doctorConfig;
  return {
    honorific: doctor.honorific,
    full_name: doctor.fullName,
    specialty: doctor.specialty,
    short_intro: doctor.shortIntro,
    bio: [...doctor.bio],
    statement_line1: "رعاية تُصغي إليك.",
    statement_line2: "ولعائلتك كلها.",
    photo_path: doctor.photo.src,
    education: doctor.education.map((e) => ({ degree: e.degree, institution: e.institution, year: e.year ?? null })),
    experience: doctor.experience.map((x) => ({ ...x })),
    languages: [...doctor.languages],
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    email: contact.email ?? null,
    socials: contact.socials.map((s) => ({ ...s })),
    whatsapp_default_message: whatsapp.defaultMessage,
    updated_at: new Date(0).toISOString(),
  };
}

/**
 * A stored profile row with the onboarding value in place of every empty field the doctor cannot leave empty
 * (names, specialty, intro, statement lines, bio, languages, WhatsApp). Fields the dashboard lets the doctor clear
 * on purpose (photo, education, experience, phone, email, social accounts) stay as they are.
 */
export function withProfileDefaults(row: Profile): Profile {
  const d = onboardingProfile();
  const str = (v: string, fallback: string) => (v.trim() === "" ? fallback : v);
  const arr = <T>(v: T[], fallback: T[]) => (v.length === 0 ? fallback : v);
  return {
    ...row,
    honorific: str(row.honorific, d.honorific),
    full_name: str(row.full_name, d.full_name),
    specialty: str(row.specialty, d.specialty),
    short_intro: str(row.short_intro, d.short_intro),
    statement_line1: str(row.statement_line1, d.statement_line1),
    statement_line2: str(row.statement_line2, d.statement_line2),
    whatsapp: str(row.whatsapp, d.whatsapp),
    whatsapp_default_message: str(row.whatsapp_default_message, d.whatsapp_default_message),
    bio: arr(row.bio, d.bio),
    languages: arr(row.languages, d.languages),
  };
}
