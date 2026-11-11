# Task 11c — Clinic form: address right above the map, phone/WhatsApp with country picker (Syria default), singular "العيادة" when there is one clinic

## Owner feedback (on PR #3)
> 1. Put the **address field right above the map**.
> 2. Phone and WhatsApp: **pick the country first, with Syria pre-selected**, so the doctor can't type a wrong number. Use **Zod**.
> 3. On the public site, when there is **only one clinic**, write **"العيادة"**, not "العيادات".

## Before you start
- PR #3 (task 11b) is merged. Start from the latest `main` on the branch `task/11c-clinic-form-phone`.
- Install (slow-network flags):
  ```bash
  npm install --fetch-timeout=600000 --fetch-retries=5 libphonenumber-js
  ```
  It's pure JavaScript and works on Cloudflare Workers. Use `libphonenumber-js/max` **on the server only**, for validation and number type. The browser only needs the country list.

## Part A — Field order in `ClinicForm.astro`
New order:
1. Name
2. Phone
3. WhatsApp
4. Description
5. A group titled **"موقع العيادة"** containing:
   1. the **address** textarea (label "العنوان", required)
   2. **directly under it**, the map with its buttons and status line

Map clicks keep filling the address field just above.

## Part B — Phone numbers

### 1. `src/lib/phone.ts` (shared, no DOM)
```ts
export const PHONE_COUNTRIES: { code: CountryCode; nameAr: string; flag: string }[]
// In this order: SY سوريا, LB لبنان, JO الأردن, IQ العراق, TR تركيا, SA السعودية, AE الإمارات, QA قطر,
// KW الكويت, BH البحرين, OM عُمان, EG مصر, DE ألمانيا, NL هولندا, SE السويد
// flag = emoji. The dial code comes from getCountryCallingCode(code) (use it at build/render time).

export function splitPhone(stored: string | null, fallback: CountryCode): { country: CountryCode; national: string }
// Parse a stored value ("+963 944 123 456" or "963944123456") back into a country and a national number, for edit forms.
// If it can't be parsed → { country: fallback, national: "" }.
```

### 2. Config: default country
- `doctor.schema.ts`: add `contact.defaultCountry`, an enum of the codes above, with default `"SY"`.
- `doctor.config.ts`: set `defaultCountry: "SY"`.

### 3. Zod: `src/lib/validation/phone.ts`
```ts
export const phoneParts = (opts: { kind: "phone" | "whatsapp"; required: boolean }) => z.object({
  country: z.enum([...codes]),
  national: z.string().trim().max(20),
}).superRefine(...).transform(...)
```
- An empty `national` is allowed when `required` is false, and gives `null`.
- Otherwise: `parsePhoneNumberFromString(national, country)` must exist and `isValid()`. Error: "رقم غير صحيح لهذا البلد".
- `kind: "whatsapp"`: `getType()` must be `MOBILE` or `FIXED_LINE_OR_MOBILE`, or undefined when unknown. Error: "رقم واتساب يجب أن يكون رقم جوال".
- A leading national `0` is fine (Syrians type `0944…`); libphonenumber removes it.
- Output:
  - `kind: "phone"` → `formatInternational()`, for example `+963 944 123 456`
  - `kind: "whatsapp"` → the E.164 digits without `+`, for example `963944123456`. This matches the DB check `^\d{8,15}$`, so `db/` needs no change.
- In `clinicInput`, replace `phone` and `whatsapp` with these. Form field names: `phone_country`, `phone_national`, `whatsapp_country`, `whatsapp_national`. Map them in `parseForm` or in the page before validating; keep the output field names `phone` and `whatsapp` for the repo.

### 4. Component: `src/components/dashboard/PhoneField.astro`
- Props: `name` ("phone" | "whatsapp"), `label`, `country`, `national`, `error`, `hint`, `required?`.
- One row with `dir="ltr"`:
  - a `<select name="{name}_country">`: options show `flag +code nameAr` (for example `🇸🇾 ‎+963 سوريا`), the selected one from props
  - then `<input name="{name}_national" inputmode="tel" autocomplete="tel-national">` with a placeholder that changes with the country (an example national number per country; Syria `944 123 456`)
- The select and input sit side by side and look like one field (shared border), RTL page but LTR inside.
- Tiny script: changing the country updates the placeholder, and typing allows digits, spaces and `-` only.

### 5. Clinic form
- Phone: `PhoneField name="phone"` (optional).
- WhatsApp: `PhoneField name="whatsapp"` (optional), with the hint "اتركه فارغًا لاستخدام رقم الطبيب الرئيسي".
  - Above it, a checkbox **"نفس رقم الهاتف"**. When ticked, the script copies the phone country and number into the WhatsApp fields and disables them. The server also copies phone → WhatsApp when the checkbox is sent.
- New clinic: both selects default to `doctorConfig.contact.defaultCountry` (Syria).
- Edit: preselect with `splitPhone(row.phone, default)` and `splitPhone(row.whatsapp, default)`. The Saudi sample numbers must open as Saudi Arabia.

## Part C — Singular "العيادة" with one clinic
- `src/lib/arabic.ts`: add `clinicsWord(n): "العيادة" | "العيادات"`. It returns `"العيادة"` when `n === 1`, otherwise `"العيادات"` (0 counts as plural).
- `src/lib/data.ts`: add `getActiveClinicCount(): Promise<number>`.
- `src/lib/nav.ts`: turn `sectionLinks` into `getSectionLinks(clinicCount: number)`. The clinics link label uses `clinicsWord(n)`.
- `PublicLayout.astro`: load the count once and pass it to `Header` and `Footer` (desktop nav, mobile menu, footer links).
- Replace every fixed "العيادات" on the public site with the helper:
  - Hero ghost button and About button: `{clinicsWord(n)} والمواعيد` (both the visible text and `data-t` of the roll)
  - `ClinicsSection` eyebrow
  - `HowToBookSection` step 1: when `n === 1`, title "تعرّف على العيادة" and text "اطّلع على موقع العيادة وساعات عملها."; otherwise keep the current text
  - anything else found with `grep -rn "العيادات" src/components/public src/layouts`
- The hero badge already uses `clinicsPhrase(n)`; keep it.

## Acceptance criteria
- [ ] The address field sits directly above the map. Clicking the map fills it.
- [ ] New clinic: the phone and WhatsApp country pickers show 🇸🇾 ‎+963 سوريا. Typing `0944123456` → saved as `+963 944 123 456` (phone) and `963944123456` (WhatsApp).
- [ ] `12345` in Syria → "رقم غير صحيح لهذا البلد", with the typed values kept.
- [ ] A Syrian landline (for example Damascus `11 223 4567`) as WhatsApp → the mobile error.
- [ ] "نفس رقم الهاتف" copies and locks the WhatsApp fields, and the saved WhatsApp equals the phone.
- [ ] Editing a sample clinic opens with Saudi Arabia selected and the right national number.
- [ ] The public WhatsApp button of a Syrian clinic opens `https://wa.me/963944123456?...`.
- [ ] Hide clinics until only one is visible → the nav, footer, hero button, About button and clinics eyebrow all say "العيادة", and the badge says "في عيادة واحدة". With 2 or more → "العيادات".
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit, a pushed branch, a PR: `task11c: clinic form order, phone country picker, singular clinic wording`.

## Out of scope
- The doctor's own contact numbers in `doctor.config.ts` (onboarding data).
- Working hours (task 12).
