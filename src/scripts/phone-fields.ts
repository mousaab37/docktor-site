// Dashboard phone fields with intl-tel-input. The server still validates everything (Zod + libphonenumber).
// The country list comes from the server (data-countries, generated from PHONE_COUNTRIES in src/lib/phone.ts),
// so there is no second list here.
import intlTelInput, { type Iso2, type Iti } from "intl-tel-input";
import { ar } from "intl-tel-input/locale"; // named export (the package types only describe this form); tree-shaken to Arabic
import "intl-tel-input/styles";

interface Field {
  box: HTMLElement;
  name: string;
  input: HTMLInputElement;
  hidden: HTMLInputElement;
  iti: Iti;
}

const fields = new Map<HTMLInputElement, Field>();

function init(box: HTMLElement): void {
  const name = box.dataset.phoneField ?? "";
  const input = box.querySelector<HTMLInputElement>(`input[name="${name}_national"]`);
  const hidden = box.querySelector<HTMLInputElement>(`input[name="${name}_country"]`);
  if (!input || !hidden) return;
  const countries = (box.dataset.countries ?? "").split(",").filter(Boolean) as Iso2[];

  const iti = intlTelInput(input, {
    initialCountry: hidden.value.toLowerCase() as Iso2,
    onlyCountries: countries,
    countryOrder: countries, // the same order as PHONE_COUNTRIES (Syria first)
    countryNameLocale: "ar", // Arabic country names (Intl.DisplayNames)
    uiTranslations: { ...ar, searchPlaceholder: "ابحث عن دولة" },
    separateDialCode: true,
    countrySearch: true,
    strictMode: true, // digits only, capped at the valid length
    formatAsYouType: true,
    // The utils file (formatting, placeholders) is loaded lazily.
    loadUtils: () => import("intl-tel-input/utils"),
  });
  fields.set(input, { box, name, input, hidden, iti });

  // Numbers typed with the national leading zero (0944...) are not formatted while typing;
  // when the field loses focus, show them in the formatted national form.
  input.addEventListener("blur", () => {
    const f = fields.get(input);
    if (!f || input.disabled || input.value.trim() === "") return;
    const full = e164(f);
    if (full && iti.isValidNumber()) iti.setNumber(full);
  });

  // Keep the hidden country field in sync (ISO2, upper case).
  const syncCountry = () => {
    const iso = iti.getSelectedCountry()?.iso2;
    if (iso) hidden.value = iso.toUpperCase();
  };
  input.addEventListener("countrychange", syncCountry);
  syncCountry();
}

/** The full E.164 number (`+963944123456`) of a field, or "" when it is empty. */
function e164(f: Field): string {
  if (f.input.value.trim() === "") return "";
  const full = f.iti.getNumber();
  if (full) return full;
  // The utils file may not have arrived yet: build it by hand (drop the national leading zero).
  const dial = f.iti.getSelectedCountry()?.dialCode;
  const digits = f.input.value.replace(/\D/g, "").replace(/^0+/, "");
  return dial && digits ? `+${dial}${digits}` : "";
}

document.querySelectorAll<HTMLElement>("[data-phone-field]").forEach(init);

// On submit, write the E.164 number into the `<name>_national` input. The server's
// parsePhoneNumberFromString(value, country) accepts it and still checks the calling code against the country.
document.querySelectorAll<HTMLFormElement>("form").forEach((form) => {
  const mine = [...fields.values()].filter((f) => form.contains(f.input));
  if (!mine.length) return;
  form.addEventListener("submit", () => {
    for (const f of mine) {
      if (f.input.disabled) continue; // "same as phone": the server copies the phone number
      const value = e164(f);
      if (value) f.input.value = value;
    }
  });

  // "نفس رقم الهاتف": copy the phone into the WhatsApp field and lock it.
  const same = form.querySelector<HTMLInputElement>("[data-same-phone]");
  const phone = mine.find((f) => f.name === "phone");
  const whatsapp = mine.find((f) => f.name === "whatsapp");
  if (!same || !phone || !whatsapp) return;
  const apply = () => {
    if (same.checked) {
      const iso = phone.iti.getSelectedCountry()?.iso2;
      if (iso) whatsapp.iti.setSelectedCountry(iso);
      whatsapp.iti.setNumber(e164(phone) || phone.input.value);
    }
    whatsapp.iti.setDisabled(same.checked);
  };
  same.addEventListener("change", apply);
  phone.input.addEventListener("input", apply);
  phone.input.addEventListener("countrychange", apply);
  apply();
});
