import { z } from "zod";
import type { Profile } from "../types";
import { text } from "./common";
import { parseValues, type ParseResult } from "./form";
import { phoneParts } from "./phone";
import { collectRows } from "./rows";

const PLATFORMS = ["instagram", "x", "facebook", "tiktok", "youtube", "linkedin", "snapchat", "telegram"] as const;

// Each card of "ملفي" has its own schema, so the doctor can save a little at a time.
export const profileIdentityInput = z.object({
  honorific: text(1, 20),
  full_name: text(1, 80),
  specialty: text(1, 80),
});

export const profileBackgroundInput = z.object({
  education: z
    .array(
      z.object({
        degree: text(1, 100),
        institution: text(1, 100),
        year: z.number().int().min(1950, "السنة بين 1950 و 2100").max(2100, "السنة بين 1950 و 2100").nullable(),
      }),
    )
    .max(6, "الحد الأقصى 6 عناصر"),
  experience: z
    .array(z.object({ role: text(1, 100), place: text(1, 100), period: text(1, 40) }))
    .max(6, "الحد الأقصى 6 عناصر"),
});

export const profileContactInput = z.object({
  phone: phoneParts({ kind: "phone", required: false }),
  whatsapp: phoneParts({ kind: "whatsapp", required: true }),
  email: z.email("بريد إلكتروني غير صحيح").max(120).nullable(),
  whatsapp_default_message: text(1, 300),
});

export const profileSocialsInput = z.object({
  socials: z
    .array(
      z.object({
        platform: z.enum(PLATFORMS),
        url: z
          .string()
          .trim()
          .max(500)
          .regex(/^https:\/\//, "الرابط يجب أن يبدأ بـ https://")
          .refine((v) => URL.canParse(v), "رابط غير صحيح"),
      }),
    )
    .max(8, "الحد الأقصى 8 حسابات"),
});

/** What `profile.update()` takes: only the fields of the card being saved. */
export type ProfileInput = Partial<Omit<Profile, "updated_at">>;

export type CardResult<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> };

const run = <S extends z.ZodType>(schema: S, raw: Record<string, unknown>): CardResult<z.output<S>> => {
  const r: ParseResult<z.output<S>> = parseValues(schema, raw);
  return r.ok ? { ok: true, data: r.data } : { ok: false, errors: r.errors };
};

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};

/** The typed form values of a card (what the user typed), used to show the card again after an error. */
export type CardTyped = Record<string, unknown>;

export function readIdentity(fd: FormData): { typed: CardTyped; result: CardResult<z.output<typeof profileIdentityInput>> } {
  const typed = { honorific: str(fd, "honorific"), full_name: str(fd, "full_name"), specialty: str(fd, "specialty") };
  return { typed, result: run(profileIdentityInput, typed) };
}

export function readBackground(fd: FormData): { typed: CardTyped; result: CardResult<z.output<typeof profileBackgroundInput>> } {
  const typed = {
    education: collectRows(fd, "education", ["degree", "institution", "year"], 8).map((r) => ({
      degree: r.degree,
      institution: r.institution,
      // An empty year is allowed; text that is not a number becomes -1 so the range message shows.
      year: r.year === "" ? null : Number.isNaN(Number(r.year)) ? -1 : Number(r.year),
    })),
    experience: collectRows(fd, "experience", ["role", "place", "period"], 8),
  };
  return { typed, result: run(profileBackgroundInput, typed) };
}

export function readContact(fd: FormData): { typed: CardTyped; result: CardResult<z.output<typeof profileContactInput>> } {
  const typed = {
    phone: { country: str(fd, "phone_country"), national: str(fd, "phone_national") },
    whatsapp: { country: str(fd, "whatsapp_country"), national: str(fd, "whatsapp_national") },
    email: str(fd, "email") || null,
    whatsapp_default_message: str(fd, "whatsapp_default_message"),
  };
  return { typed, result: run(profileContactInput, typed) };
}

export function readSocials(fd: FormData): { typed: CardTyped; result: CardResult<z.output<typeof profileSocialsInput>> } {
  const typed = { socials: collectRows(fd, "social", ["platform", "url"], 10) };
  return { typed, result: run(profileSocialsInput, typed) };
}
