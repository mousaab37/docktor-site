import { z } from "zod";
import { splitPhone, type PhoneCountry } from "../phone";
import { optText, text } from "./common";
import { parseForm, type FormValues, type ParseResult } from "./form";
import { phoneParts } from "./phone";

export const clinicInput = z
  .object({
    name: text(1, 120),
    address: text(1, 300),
    // Typed as country + national number; the output is the stored string (or null).
    phone: phoneParts({ kind: "phone", required: false }),
    whatsapp: phoneParts({ kind: "whatsapp", required: false }),
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

/**
 * Reads the clinic form. The phone and WhatsApp fields come as `<name>_country` + `<name>_national`;
 * when "نفس رقم الهاتف" (`whatsapp_same`) is sent, the WhatsApp number is the phone number.
 */
export function parseClinicForm(fd: FormData): ParseResult<ClinicInput> {
  const field = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : "";
  };
  const same = fd.has("whatsapp_same");
  const phone = { country: field("phone_country"), national: field("phone_national") };
  const whatsapp = same ? phone : { country: field("whatsapp_country"), national: field("whatsapp_national") };
  return parseForm(clinicInput, fd, {
    raw: { phone, whatsapp },
    values: {
      phone_country: phone.country,
      phone_national: phone.national,
      whatsapp_country: whatsapp.country,
      whatsapp_national: whatsapp.national,
      whatsapp_same: same,
    },
  });
}

/** The values a clinic form starts with. Pass a stored clinic to edit it, or nothing for a new one. */
export function clinicFormValues(
  row: {
    name: string;
    address: string;
    phone: string | null;
    whatsapp: string | null;
    latitude: number | null;
    longitude: number | null;
    description: string | null;
    is_active: boolean;
  } | null,
  defaultCountry: PhoneCountry,
): FormValues {
  const phone = splitPhone(row?.phone ?? null, defaultCountry);
  const whatsapp = splitPhone(row?.whatsapp ?? null, defaultCountry);
  return {
    name: row?.name ?? "",
    address: row?.address ?? "",
    phone_country: phone.country,
    phone_national: phone.national,
    whatsapp_country: whatsapp.country,
    whatsapp_national: whatsapp.national,
    whatsapp_same: false,
    latitude: row?.latitude == null ? "" : String(row.latitude),
    longitude: row?.longitude == null ? "" : String(row.longitude),
    description: row?.description ?? "",
    is_active: row ? row.is_active : true,
  };
}
