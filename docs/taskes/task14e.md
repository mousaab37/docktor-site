# Task 14e — FAQ: dashboard tab + public section (with FAQPage structured data)

## Owner decision (2026-11-13)
> Add the FAQ to the dashboard and to the public site. SEO and GEO (being cited by AI answer engines such as ChatGPT, Gemini and Perplexity) are the main selling point.

This overrides the PRD and the AGENTS.md rule "no FAQ". This task also updates AGENTS.md.

## Before you start
- PR #10 (task 14d) is merged. Start from the latest `main` on the branch `task/14e-14f-faq-seo`. This task and task 14f run together on that branch.
- Visual reference: `src/components/SectionFaq.astro` and the `.faq-grid`, `.faq-l`, `.qa`, `summary i` and `@keyframes qa` rules in `public/site.css`. Copy that look and its open/close animation, mirrored for RTL.
- Reuse `FormDialog`, `Field`, `Toggle`, `RowActions`, `StatusBadge`, `Flash`, `EmptyState` and `parseForm`. Don't touch `db/`.

## Data
- Type `Faq { id; question: string; answer: string; display_order: number; is_published: boolean; created_at; updated_at }`.
- Zod `faqInput`: question 5–200 characters, answer 20–1500 characters (plain text, with line breaks allowed), `is_published`. Arabic messages.
- Repo: `faqs: CrudTable<Faq, FaqInput> & Orderable`. Seed 6 **fictional** but useful family-doctor questions in the memory store, each marked `// SAMPLE`, for example: هل أحتاج موعدًا مسبقًا؟، كيف أحجز عبر واتساب؟، ما مدة الكشف؟، هل تستقبلون الأطفال؟، هل يمكن الاستشارة عن بُعد؟، ماذا أحضر معي في الزيارة الأولى؟. Write answer-first: the first sentence answers directly.
- `data.ts`: `getPublishedFaqs()`.

## Dashboard — tab "الأسئلة الشائعة" (`/dashboard/faq`)
- Nav: **10 items**. Put it after "خدماتي".
- List page, with the same pattern as testimonials:
  - the question, then the first 120 characters of the answer
  - `StatusBadge`, ↑↓, edit, delete
  - edit and add open in a `FormDialog` of size `md`
- A hint box at the top of the page (important for the doctor):
  "اكتب السؤال كما يكتبه المريض في جوجل، وابدأ الجواب بإجابة مباشرة في الجملة الأولى ثم التفاصيل. هذا يساعد جوجل ومحركات الذكاء الاصطناعي على عرض إجاباتك."
- Overview: add a "الأسئلة الشائعة" count card, and a checklist item "✓/✗ 3 أسئلة شائعة منشورة على الأقل".

## Public — FAQ section on `/` (`id="faq"`)
- `FaqSection.astro`, a port of `SectionFaq.astro`:
  - sticky left column: eyebrow "أسئلة شائعة", title "قبل <em>زيارتك الأولى.</em>", a lead, and the WhatsApp button
  - right column: `<details class="qa">`, with the first one open, the + icon turning into × and the answer animation
- Order on `/`: put it **before** the contact CTA band.
- Render nothing if there are no published FAQs.
- Nav: add "الأسئلة الشائعة" → `/#faq` (header, mobile menu, footer). `CompareButton`: `#faq` ↔ `#faq`.
- Answers render as text, with line breaks turned into `<br>` and **no HTML injection** (escape the text).

## Structured data
- In `src/lib/jsonld.ts`, add a `FAQPage` with `mainEntity` = each published FAQ as `Question` with `acceptedAnswer` `Answer`. Emit it on `/` **only when there are FAQs**, and only with FAQs that are actually visible on the page.

## Rules update
In AGENTS.md §3/§4:
- remove "no FAQ" from the excluded list
- dashboard = 10 sections, with "الأسئلة الشائعة" after "خدماتي"
- the landing page sections include FAQ

## Acceptance criteria
- [ ] Add, edit, hide, reorder and delete FAQs in the dashboard (popup). Each change appears on `/#faq`.
- [ ] The FAQ section looks and animates like the original (side by side with `/dev/reference#faq`).
- [ ] `/` contains valid `FAQPage` JSON-LD with exactly the published questions.
- [ ] An answer containing `<script>` shows as plain text.
- [ ] 375px: no horizontal scroll.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] Commit: `task14e: faq dashboard and public section`.
