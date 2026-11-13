# Task 14g — Hidden service can't be featured; all sample numbers are Syrian (+963)

## Owner feedback
> 1. A **hidden** service must not be "مميزة" (featured). Today the dashboard shows "⭐ مميزة" and "مخفي" on the same service.
> 2. All numbers in the dashboard should use the default, **Syria +963**.

## Before you start
- The PR for 14e + 14f is merged. Start from the latest `main` on the branch `task/14g-featured-syria`. Don't touch `db/`.

## 1. Featured only when visible
- Repo (`memory.ts`), services:
  - saving a service with `is_active: false` also sets `is_featured: false`
  - `feature(id)` on a hidden service does nothing (or returns an error)
  - when the featured service gets hidden, **no service is featured automatically**; the public site already falls back to the first active service
- Zod `serviceInput`: `superRefine`. If `is_featured && !is_active`, the error is "لا يمكن جعل خدمة مخفية مميزة" on `is_featured`.
- Dashboard:
  - hidden rows don't show the "⭐ مميزة" badge or the "اجعلها مميزة" button
  - in the form, the "خدمة مميزة" toggle is disabled (with the hint "أظهر الخدمة أولًا") while "ظاهر في الموقع" is off; a tiny script handles it, and the server rule above is the real guard
- Seed: no hidden service is featured.

## 2. Syria everywhere
- **Every** `PhoneField` defaults to `doctorConfig.site.defaultCountry` (`SY`) when the stored number is empty: clinic phone, clinic WhatsApp, profile phone, profile WhatsApp. Check with `grep -rn "PhoneField" src`.
- Change **all sample numbers** to fictional Syrian ones, keeping the `// SAMPLE` comments:
  - doctor WhatsApp `963944000000`, doctor phone `+963 944 000 000`
  - clinic 1: phone `+963 944 000 001`, WhatsApp `963944000001`
  - clinic 2: phone `+963 944 000 002`
  - the hidden clinic: phone `+963 944 000 003`
  - Update `doctor.config.ts`, `sample-data.ts` and anything else that has `966…` (`grep -rn "966" src`).
- The sample clinic coordinates stay in Riyadh for now, unless the config `site.city` was changed. Don't change them.
- Edit forms of sample clinics now open with 🇸🇾 +963.

## Acceptance criteria
- [ ] Hide the featured service → it loses ⭐. The toggle is disabled while it's hidden. Posting `is_featured=on` with `is_active` off returns the Arabic error.
- [ ] `/` uses the first active service as the featured card when the featured one is hidden.
- [ ] Every phone field in the dashboard opens with Syria +963. `grep -rn "966" src` returns nothing.
- [ ] Public WhatsApp buttons go to `wa.me/963…`.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit, a pushed branch, a PR: `task14g: featured only when visible, Syrian sample numbers`.
