# دليل نشر موقع طبيب على Cloudflare (من جهازك، بدون GitHub)

دليل تنفّذه أنت بنفسك لكل عميل. كل طبيب له:

- مجلد على جهازك (نسخة من المشروع)
- مشروع Supabase خاص
- حساب Cloudflare خاص، وWorker خاص داخله

لا تحتاج مستودع GitHub للطبيب، ولا تربط أي أداة ذكاء اصطناعي بحساب Cloudflare الخاص بالعميل. النشر يتم من الطرفية على جهازك بعد تسجيل الدخول إلى حساب ذلك الطبيب.

**الوقت المتوقع:** 30–45 دقيقة للمرة الأولى، و15 دقيقة بعد التعوّد.

---

## 0. قبل أن تبدأ

| المطلوب | ملاحظة |
|---|---|
| استمارة الطبيب مكتملة مع الصور | `docs/onboarding/doctor-intake-form.docx` |
| مشروع Supabase جاهز للطبيب | اتبع `db/README.md`. يجب أن يكون `03-check.sql` كله `true`. **لا تشغّل** `90-sample-data.sql` على مشروع حقيقي |
| حساب Cloudflare باسم الطبيب | أنت تسجّل الدخول إليه من المتصفح عند `wrangler login`. الأفضل أن يملكه الطبيب ويضيفك عضوًا |
| Node.js 22 أو أحدث | على جهازك. تحقق بـ `node -v` |
| الدومين | يمكن البدء بدون دومين على رابط `*.workers.dev` المجاني |

---

## 1. جهّز مجلد الطبيب على جهازك

### 1.1 انسخ المشروع (بدون GitHub)

انسخ مجلد القالب إلى مجلد جديد باسم الطبيب، مثل:

```text
C:\Users\Lenovo\Desktop\CODE\clients\dr-sara-alamin
```

لا تنسخ `node_modules` ولا `.env` ولا `.dev.vars` ولا `dist`. ثم من داخل مجلد الطبيب:

```powershell
npm install --fetch-timeout=600000 --fetch-retries=5
```

كل عميل يبقى في مجلده. لا تنشر عميلين من نفس المجلد.

### 1.2 عدّل إعدادات الطبيب: `src/config/doctor.config.ts`

عبّئ هذه الحقول من الاستمارة. ما لا يُعدَّل من اللوحة يجب أن يكون صحيحًا هنا:

| الحقل | من أين |
|---|---|
| `site.url` | الدومين النهائي، مثل `https://dr-sara.com` (بدون `/` في النهاية). قبل شراء الدومين يمكن وضع رابط `workers.dev` مؤقتًا ثم تغييره |
| `site.name`، `site.defaultTitle`، `site.defaultDescription` | الاسم، والعنوان، ووصف حتى 160 حرفًا |
| `site.city` | المدينة الأساسية (القسم 1 من الاستمارة) |
| `site.ogImage` | `/img/share.jpg` |
| `site.defaultCountry` | `SY` أو دولة الطبيب |
| `brand.primary`، `brand.accent` | اللونان (القسم 11) |
| `brand.logoText` / `brand.logoImage` | نص الشعار، أو `/img/logo.svg` |
| `privacy` | نص سياسة الخصوصية وتاريخ آخر تحديث |
| `doctor`، `contact`، `services` | **البيانات الأولى فقط.** بعد النشر يعدّلها الطبيب من اللوحة («ملفي» و«خدماتي») |

**الصور:** ضع صور الطبيب في `public/img/` بالأسماء المستعملة في الإعداد. باقي الصور (الشهادات، والخدمات، والعيادات) يرفعها الطبيب أو أنت من لوحة التحكم بعد النشر.

### 1.3 عدّل `astro.config.mjs`

```js
site: "https://dr-sara.com",   // نفس site.url
```

### 1.4 عدّل `wrangler.jsonc` في جذر المشروع

```jsonc
{
  "name": "dr-sara-alamin",
  "compatibility_date": "2026-11-01"
}
```

الاسم يجب أن يكون فريدًا داخل حساب Cloudflare هذا الطبيب: حروف إنجليزية صغيرة وأرقام وشرطات.

### 1.5 تأكد أن البناء ينجح

```powershell
npm run build
npx astro check
```

لا حاجة لـ `git commit` ولا `git push` لهذا المسار.

---

## 2. ادخل حساب Cloudflare الخاص بهذا الطبيب

هذه أهم خطوة عند إعادة البيع: كل نشر يذهب إلى الحساب الذي سجّلت الدخول إليه آخر مرة.

من مجلد الطبيب:

```powershell
npx wrangler whoami
```

إذا ظهر حساب طبيب سابق، اخرج ثم ادخل حساب الطبيب الحالي:

```powershell
npx wrangler logout
npx wrangler login
```

يفتح المتصفح. سجّل الدخول بحساب **هذا** الطبيب فقط، ثم:

```powershell
npx wrangler whoami
```

لا تكمل إلا إذا كان البريد الظاهر هو حساب هذا العميل.

---

## 3. انشر أول مرة

ما زلت داخل مجلد الطبيب:

```powershell
npm run build
npx wrangler deploy
```

في نهاية الأمر يظهر رابط مثل:

```text
https://dr-sara-alamin.<الحساب>.workers.dev
```

أول فتح قد يعطي خطأ 500 لأن مفاتيح Supabase لم تُضف بعد. أكمل الخطوة 4 ثم أعد النشر.

---

## 4. أضف مفاتيح Supabase

**بدون هذه الخطوة تعطي كل صفحات الموقع خطأ 500.**

من نفس المجلد (وبعد `whoami` الصحيح):

```powershell
npx wrangler secret put SUPABASE_URL
```

الصق `https://xxxx.supabase.co` (من Supabase ← Project Settings ← API) ثم Enter.

```powershell
npx wrangler secret put SUPABASE_KEY
```

الصق المفتاح **Publishable** الذي يبدأ بـ `sb_publishable_` ثم Enter.

> لا تضع أبدًا المفتاح `sb_secret_…` ولا `service_role`.

ثم أعد النشر حتى يقرأ الـ Worker المفاتيح:

```powershell
npx wrangler deploy
```

يمكنك أيضًا إضافتها من لوحة Cloudflare: **Workers & Pages ← اسم الـ Worker ← Settings ← Variables and Secrets**. النوع: Text لـ `SUPABASE_URL`، وSecret لـ `SUPABASE_KEY`. بعد الحفظ من اللوحة أعد `npx wrangler deploy`.

---

## 5. جرّب الموقع على الرابط المؤقت

افتح `https://dr-sara-alamin.<حسابك>.workers.dev` وتأكد من:

- [ ] الصفحة الرئيسية تعمل وتعرض بيانات الطبيب.
- [ ] `/dashboard` يحوّلك إلى `/login`.
- [ ] تسجيل الدخول بحساب الطبيب يعمل، وإضافة شهادة تظهر في Supabase ثم في الموقع.
- [ ] `/dev/styleguide` و`/dev/reference` تعطيان **404** (صفحات التطوير مخفية في الإنتاج).

---

## 6. ربط الدومين

### 6.1 أدخل الدومين إلى Cloudflare (مرة واحدة)

1. **Add a domain** ← اكتب الدومين ← الخطة **Free**.
2. Cloudflare يعطيك **Nameserverين**. ضعهما عند الشركة التي اشتريت منها الدومين (Namecheap، GoDaddy، …).
3. انتظر حتى تصير حالة الدومين **Active** (دقائق إلى 24 ساعة).

### 6.2 اربطه بالـ Worker

**Workers & Pages ← الـ Worker ← Settings ← Domains & Routes ← Add ← Custom domain**

- أضف `dr-sara.com`.
- وأضف `www.dr-sara.com` أيضًا.

### 6.3 وجّه `www` إلى الدومين الأساسي (مهم لـ SEO، حتى لا تظهر نسختان)

**الدومين ← Rules ← Redirect Rules ← Create rule ← Redirect from WWW to root** (قالب جاهز) ← 301.

### 6.4 حدّث العنوان في الكود ثم أعد النشر

في `src/config/doctor.config.ts` و`astro.config.mjs` ضع `https://dr-sara.com`، ثم:

```powershell
npx wrangler whoami
npm run build
npx wrangler deploy
```

### 6.5 حدّث Supabase

**Supabase ← Authentication ← URL Configuration**

- **Site URL:** `https://dr-sara.com`
- **Redirect URLs:** أضف `https://dr-sara.com/**`

---

## 7. الفحص بعد النشر

من مجلد الطبيب:

**فحص SEO على الموقع الحقيقي:**

```powershell
npm run seo:check -- https://dr-sara.com
```

يجب أن تكون كل السطور ✅.

**فحص الأمان على قاعدة بيانات الطبيب:**

```powershell
npm run verify:security
```

يجب أن تنجح الفحوصات الـ 16. يحتاج ملف `.env` ببيانات مشروع الطبيب، و`.env.test.local` ببريده وكلمة مروره. هذان الملفان يبقيان على جهازك فقط، ولا يُنسخان إلى مجلد عميل آخر.

**فحص البيانات المنظمة:** الصق رابط الموقع في

- [search.google.com/test/rich-results](https://search.google.com/test/rich-results)
- [validator.schema.org](https://validator.schema.org)

**السرعة:** Chrome ← F12 ← **Lighthouse** ← Mobile. الهدف: SEO = 100.

---

## 8. محركات البحث والذكاء الاصطناعي (نقطة البيع)

1. **Google Search Console:** [search.google.com/search-console](https://search.google.com/search-console)
   - **Add property ← Domain** ← انسخ سجل TXT ← أضفه في Cloudflare (**DNS ← Records ← Add ← TXT**) ← **Verify**.
   - **Sitemaps** ← أضف `sitemap.xml` ← **Submit**.
   - **URL Inspection** ← الصفحة الرئيسية ← **Request indexing**.
2. **Bing Webmaster Tools:** [bing.com/webmasters](https://www.bing.com/webmasters) ← **Import from Google Search Console**. مهم: Bing يغذّي **ChatGPT وCopilot**.
3. **Google Business Profile** للعيادة: ضع رابط الموقع فيه. هذه أقوى إشارة للبحث المحلي («طبيب أسرة في …»).
4. تأكد أن `https://dr-sara.com/llms.txt` و`/robots.txt` يفتحان.

---

## 9. إعادة النشر بعد تعديل الموقع

أعد النشر من **نفس المجلد** الذي نشرت منه أول مرة. الدومين والمفاتيح تبقى على Cloudflare. لا تعِد `wrangler login` إلا إذا غيّرت الحساب.

### متى تعيد النشر

| غيّرت | ماذا تفعل |
|---|---|
| كود، ألوان، شعار، `doctor.config.ts`، `astro.config.mjs`، صور في `public/` | أعد البناء والنشر (الأوامر أدناه) |
| نص أو صور من لوحة التحكم (ملفي، خدماتي، العيادات، المقالات، الشهادات، الأسئلة) | لا شيء. الموقع يقرأها من Supabase مباشرة |
| مفاتيح Supabase فقط | `npx wrangler secret put …` ثم `npx wrangler deploy` |
| `db/01-setup.sql` | الصق التغيير في Supabase هذا الطبيب، ثم شغّل `03-check.sql`. أعد النشر فقط إذا تغيّر كود الموقع معه |

### الأوامر

من PowerShell، داخل مجلد ذلك الطبيب:

```powershell
cd "C:\Users\Lenovo\Desktop\CODE\clients\dr-sara-alamin"
npx wrangler whoami
npm run build
npx wrangler deploy
```

إذا كان `whoami` حساب طبيب آخر:

```powershell
npx wrangler logout
npx wrangler login
npx wrangler whoami
npm run build
npx wrangler deploy
```

بعد انتهاء الأمر حدّث الصفحة في المتصفح. إن بقي الشكل القديم، حدّث بقوة (Ctrl+F5). رابط `workers.dev` والدومين المربوط يتحدّثان معًا، لأنهما نفس الـ Worker.

### نقل تحسينات القالب إلى عميل قديم

1. انسخ ملفات الكود الجديدة من القالب إلى مجلد العميل.
2. لا تستبدل `src/config/doctor.config.ts` ولا `wrangler.jsonc` ولا `public/img/` الخاصة به ولا `.env`.
3. `npx wrangler whoami` ثم `npm run build` ثم `npx wrangler deploy`.

### عند تغيير قاعدة البيانات

إذا تغيّر `db/01-setup.sql` في القالب: الصق التغيير في Supabase هذا الطبيب، ثم شغّل `03-check.sql`.

---

## 10. حل المشاكل الشائعة

| المشكلة | السبب والحل |
|---|---|
| الموقع نُشر في حساب الطبيب الخطأ | `npx wrangler whoami` كان على حساب سابق. `wrangler logout` ثم `login` بحساب هذا الطبيب، ثم `deploy` من مجلده |
| كل الصفحات تعطي **500** | `SUPABASE_KEY` أو `SUPABASE_URL` غير موجود. أعد الخطوة 4 ثم `npx wrangler deploy` |
| `wrangler` غير معروف | نفّذ الأوامر بـ `npx wrangler` من داخل مجلد الطبيب بعد `npm install` |
| الموقع يظهر بيانات تجريبية | المفاتيح غير مضبوطة، أو شُغّل `90-sample-data.sql`. احذف البيانات من Supabase |
| تسجيل الدخول يعود لصفحة الدخول | **Site URL** في Supabase غير صحيح (الخطوة 6.5)، أو حساب الطبيب ليس في `dashboard_users` (شغّل `02-add-doctor.sql`) |
| رفع الصور يفشل | تأكد أن `03-check.sql` يُظهر الحاويات الأربع |
| الروابط في جوجل تظهر بـ `workers.dev` | `site.url` في `doctor.config.ts` و`site` في `astro.config.mjs` يجب أن يكونا الدومين النهائي، ثم أعد البناء والنشر |
| مشروع Supabase متوقف (Paused) | **Restore project** في Supabase. المشاريع المجانية تتوقف بعد أسبوع بلا نشاط |

---

## 11. قائمة التسليم للطبيب

```
[ ] whoami كان حساب هذا الطبيب قبل النشر
[ ] الموقع يعمل على الدومين، و www يحوّل للأساسي
[ ] seo:check كله ✅ — verify:security 16/16
[ ] Search Console + Sitemap + Bing
[ ] الطبيب سجّل الدخول وغيّر كلمة المرور بنفسه
[ ] الطبيب مالك حسابات: Cloudflare + Supabase + الدومين (أو اتفاق مكتوب غير ذلك)
[ ] شرح سريع للوحة التحكم (10 دقائق): ملفي، الخدمات، العيادات، المقالات، إخفاء الأقسام
[ ] نسخة احتياطية أولى من قاعدة البيانات (Supabase ← Database ← Backups)
[ ] مجلد العميل محفوظ عندك، وفيه wrangler.jsonc وإعداداته، بدون مفاتيح service_role
```
