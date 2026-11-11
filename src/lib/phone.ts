// Phone helpers shared by the clinic form and its validation. No DOM here.
// `libphonenumber-js/max` is used on the server only; the browser never imports this file.
import { getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js/max";

export const COUNTRY_CODES = ["SY", "LB", "JO", "IQ", "TR", "SA", "AE", "QA", "KW", "BH", "OM", "EG", "DE", "NL", "SE"] as const;
export type PhoneCountry = (typeof COUNTRY_CODES)[number];

const NAMES_AR: Record<PhoneCountry, string> = {
  SY: "سوريا",
  LB: "لبنان",
  JO: "الأردن",
  IQ: "العراق",
  TR: "تركيا",
  SA: "السعودية",
  AE: "الإمارات",
  QA: "قطر",
  KW: "الكويت",
  BH: "البحرين",
  OM: "عُمان",
  EG: "مصر",
  DE: "ألمانيا",
  NL: "هولندا",
  SE: "السويد",
};

/** An example national mobile number per country, shown as the placeholder. */
export const PHONE_PLACEHOLDERS: Record<PhoneCountry, string> = {
  SY: "944 123 456",
  LB: "3 123 456",
  JO: "7 9012 3456",
  IQ: "790 123 4567",
  TR: "501 234 56 78",
  SA: "50 123 4567",
  AE: "50 123 4567",
  QA: "3312 3456",
  KW: "500 12345",
  BH: "3600 1234",
  OM: "9212 3456",
  EG: "10 1234 5678",
  DE: "1512 3456789",
  NL: "6 12345678",
  SE: "70 123 45 67",
};

/** The flag emoji of a country (two regional-indicator letters). */
const flagOf = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

/** In this order: Syria first. The dial code comes from `getCountryCallingCode(code)`. */
export const PHONE_COUNTRIES: { code: PhoneCountry; nameAr: string; flag: string }[] = COUNTRY_CODES.map((code) => ({
  code,
  nameAr: NAMES_AR[code],
  flag: flagOf(code),
}));

export const callingCode = (code: PhoneCountry): string => getCountryCallingCode(code);

/**
 * Parses a stored value ("+963 944 123 456" or "963944123456") back into a country and a national number,
 * for edit forms. When it cannot be parsed (or the country is not in the list) it returns the fallback.
 */
export function splitPhone(stored: string | null, fallback: PhoneCountry): { country: PhoneCountry; national: string } {
  const empty = { country: fallback, national: "" };
  if (!stored || !stored.trim()) return empty;
  const digits = stored.replace(/[^\d+]/g, "");
  const parsed = parsePhoneNumberFromString(digits.startsWith("+") ? digits : `+${digits}`);
  const country = parsed?.country as PhoneCountry | undefined;
  if (!parsed || !country || !COUNTRY_CODES.includes(country)) return empty;
  return { country, national: parsed.nationalNumber };
}
