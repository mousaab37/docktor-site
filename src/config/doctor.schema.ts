import { z } from "zod";
import { COUNTRY_CODES } from "../lib/phone";

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "must be #RRGGBB");
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be kebab-case");
const text = z.string().min(1);
const image = z.object({ src: text, alt: text });

export const doctorConfigSchema = z.object({
  site: z.object({
    name: text,
    url: z.url(),
    defaultTitle: text,
    defaultDescription: z.string().min(1).max(160),
    ogImage: text,
  }),
  doctor: z.object({
    honorific: text,
    fullName: text,
    specialty: text,
    shortIntro: z.string().min(1).max(220),
    bio: z.array(text).min(1),
    photo: image,
    education: z.array(
      z.object({ degree: text, institution: text, year: z.number().int().optional() }),
    ),
    experience: z.array(z.object({ role: text, place: text, period: text })),
    languages: z.array(text),
  }),
  brand: z.object({
    logoText: text,
    logoImage: z.string().min(1).optional(),
    primary: hex,
    accent: hex,
  }),
  contact: z.object({
    phone: text,
    whatsapp: z.string().regex(/^\d{8,15}$/, "digits only, 8-15"),
    /** The country pre-selected in the dashboard phone pickers. */
    defaultCountry: z.enum(COUNTRY_CODES).default("SY"),
    email: z.email().optional(),
    socials: z.array(
      z.object({
        platform: z.enum(["instagram", "x", "facebook", "tiktok", "youtube", "linkedin", "snapchat"]),
        url: z.url(),
      }),
    ),
  }),
  services: z
    .array(
      z.object({
        slug,
        title: text,
        description: text,
        image: image.optional(),
      }),
    )
    .min(1),
  whatsapp: z.object({
    defaultMessage: text,
    clinicMessage: text.refine((v) => v.includes("{clinic}"), {
      message: "clinicMessage must contain the {clinic} placeholder",
    }),
  }),
  privacy: z.object({
    lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
    sections: z.array(z.object({ heading: text, body: text })).min(1),
  }),
});

export type DoctorConfig = z.infer<typeof doctorConfigSchema>;
