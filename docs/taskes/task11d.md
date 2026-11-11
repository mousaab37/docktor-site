# Task 11d — Better-looking phone fields with `intl-tel-input`

## Owner feedback (on PR #4)
> The phone number field looks bad. Make it look better, or use a JS library.

Why it looks bad today: Windows doesn't render flag emoji (you see "JO" and "SA"), and the country `<select>` takes a third of the width.

## Goal
Replace the UI of `PhoneField.astro` with **intl-tel-input**, the standard phone input. It has real flag images (they work on Windows), a compact flag + dial-code button, a searchable dropdown with Arabic country names, and formatting as you type.
**The server side doesn't change.** The Zod and libphonenumber validation from task 11c stays exactly as it is, because the browser can't be trusted.

## Before you start
- PR #4 (task 11c) is merged. Start from the latest `main` on the branch `task/11d-phone-input`.
- Install:
  ```bash
  npm install --fetch-timeout=600000 --fetch-retries=5 intl-tel-input
  ```
- **Read `node_modules/intl-tel-input/README.md` for the installed version.** Option names changed between major versions (for example `loadUtils`, `i18n`, `countryOrder`, `strictMode`, `separateDialCode`). Use the names from that README, not from memory or old blog posts.

## The field (rewrite `src/components/dashboard/PhoneField.astro`; same props as today)

### Look
- A single field that looks like our other inputs: same height, border, radius, focus ring and font.
- Inside, in a `dir="ltr"` wrapper:
  - on the left, a **compact country button**: flag image + small ▾ + the dial code (for example `🇸🇾 ▾ +963`), about 110px wide, with a light divider after it
  - then the **number input**, taking the rest of the width
- Error state: a red border on the whole field; the Arabic error shows underneath, as today.
- Disabled state ("نفس رقم الهاتف"): greyed out, and the country button doesn't open.

### Dropdown
- **Arabic country names.** Use the library's Arabic i18n file (`intl-tel-input/i18n/ar` or as the README names it), and also translate the search placeholder to "ابحث عن دولة".
- The list contains **only** the `PHONE_COUNTRIES` codes from `src/lib/phone.ts`, in that same order (Syria first). Generate the option arrays from `phone.ts`; don't hard-code a second list.
- A search box at the top.
- Desktop: a dropdown under the field, as wide as the field, max height about 280px, with country names right-aligned (they're Arabic).
- Mobile: the library's full-screen popup, which is its default on small screens.

### Behavior
- Initial country: the `country` prop (new clinic → `doctorConfig.contact.defaultCountry` = SY; edit → the country from `splitPhone`, as today).
- Initial value: the `national` prop.
- Format as you type, and allow digits only (the library's strict mode).
- Load the library's `utils` lazily, the way its README describes (a dynamic import), so the first paint stays light.
- **Form submit** (no server change):
  - keep the hidden field `{name}_country` synced on `countrychange` (ISO2 upper-case, for example `SY`)
  - on submit, write the library's full E.164 number (`+963944123456`) into the `{name}_national` input. The server's `parsePhoneNumberFromString(value, country)` accepts it and still checks that the calling code matches the country.
- **"نفس رقم الهاتف"**: when ticked, copy the phone's country and number into the WhatsApp instance through the library API (`setCountry` / `setNumber`), and disable it. When unticked, enable it again.
- **Without JavaScript**: the plain `<input>` and the hidden country field still post, so the server validates as today.
- RTL page: the field stays LTR inside. The page around it stays RTL, the label sits on the right, and the dropdown doesn't overflow the page on either side.

### Styling
- Import the library CSS in the component, so it's only loaded in the dashboard. If the CSS uses flag image URLs, check that the flags show in `npm run dev` **and** in `npm run build && npm run preview`.
- Put our overrides in `src/styles/dashboard.css` under `.phone-field .iti …`, using our tokens. Don't edit `node_modules`.

## Acceptance criteria
- [ ] On Windows Chrome, the flags show as **images** (not "SY" or "JO" letters), and the field looks like the other inputs.
- [ ] The country button is compact. Clicking it opens a searchable list with Arabic names, Syria first. Typing "سور" finds Syria.
- [ ] Typing `0944123456` in Syria shows a formatted number while typing. Saving stores `+963 944 123 456` and `963944123456`, as before.
- [ ] A wrong number (for example `12345`) still gets the **server** error "رقم غير صحيح لهذا البلد".
- [ ] Editing a sample clinic opens with Saudi Arabia selected and the number shown.
- [ ] "نفس رقم الهاتف" copies and locks the WhatsApp field, and unticking unlocks it.
- [ ] Mobile 375px: the full-screen country picker works, with no horizontal scroll.
- [ ] Network tab: the utils file loads only on dashboard clinic pages, never on `/`.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes. Report the size of the dashboard phone script in the result file.
- [ ] One commit, a pushed branch, a PR: `task11d: phone fields with intl-tel-input`.

## Out of scope
Server validation (unchanged). The public site.
