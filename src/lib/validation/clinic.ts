import { z } from "zod";
import { optText, text } from "./common";

export const clinicInput = z
  .object({
    name: text(1, 120),
    address: text(1, 300),
    phone: optText(30),
    whatsapp: z.string().trim().regex(/^\d{8,15}$/, "رقم واتساب: أرقام فقط، من 8 إلى 15 رقمًا").nullish(),
    latitude: z.number().min(-90, "خط العرض بين -90 و 90").max(90, "خط العرض بين -90 و 90").nullish(),
    longitude: z.number().min(-180, "خط الطول بين -180 و 180").max(180, "خط الطول بين -180 و 180").nullish(),
    description: optText(1000),
    is_active: z.boolean(),
  })
  .refine((d) => (d.latitude == null) === (d.longitude == null), {
    message: "أدخل خط العرض والطول معًا أو اتركهما فارغين",
    path: ["latitude"],
  });

export type ClinicInput = z.infer<typeof clinicInput>;
