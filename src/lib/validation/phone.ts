import { getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js/max";
import { z } from "zod";
import { COUNTRY_CODES } from "../phone";

/**
 * A phone number typed as a country + a national number.
 *  - empty national: allowed when `required` is false, and gives `null`
 *  - otherwise it must parse and be valid for the country (a leading 0 is fine)
 *  - "whatsapp" must be a mobile number (or unknown)
 * Output: "phone" → "+963 944 123 456"; "whatsapp" → "963944123456" (E.164 digits, matches the DB check ^\d{8,15}$).
 */
export const phoneParts = (opts: { kind: "phone" | "whatsapp"; required: boolean }) =>
  z
    .object({
      country: z.enum(COUNTRY_CODES),
      national: z.string().trim().max(20),
    })
    .superRefine((v, ctx) => {
      if (v.national === "") {
        if (opts.required) ctx.addIssue({ code: "custom", message: "هذا الحقل مطلوب" });
        return;
      }
      const p = parsePhoneNumberFromString(v.national, v.country);
      // The number must belong to the chosen country (a typed "+49..." with Syria selected is refused).
      if (!p || !p.isValid() || p.countryCallingCode !== getCountryCallingCode(v.country)) {
        ctx.addIssue({ code: "custom", message: "رقم غير صحيح لهذا البلد" });
        return;
      }
      if (opts.kind === "whatsapp") {
        const type = p.getType();
        if (type && type !== "MOBILE" && type !== "FIXED_LINE_OR_MOBILE") {
          ctx.addIssue({ code: "custom", message: "رقم واتساب يجب أن يكون رقم جوال" });
        }
      }
    })
    .transform((v): string | null => {
      if (v.national === "") return null;
      const p = parsePhoneNumberFromString(v.national, v.country);
      if (!p) return null; // unreachable: superRefine already refused it
      return opts.kind === "phone" ? p.formatInternational() : p.number.replace("+", "");
    });
