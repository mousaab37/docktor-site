# دليل نشر موقع طبيب على Cloudflare

دليل خطوة بخطوة لنشر موقع **طبيب جديد**. كرّره لكل عميل: كل طبيب له مستودع GitHub خاص، ومشروع Supabase خاص، وWorker خاص على Cloudflare.

**الوقت المتوقع:** 30–45 دقيقة للمرة الأولى، و15 دقيقة بعد التعوّد.

---

## 0. قبل أن تبدأ

| المطلوب | ملاحظة |
|---|---|
| استمارة الطبيب مكتملة مع الصور | `docs/onboarding/doctor-intake-form.docx` |
| مشروع Supabase جاهز للطبيب | اتبع `db/README.md`. يجب أن يكون `03-check.sql` كله `true`. **لا تشغّل** `90-sample-data.sql` على مشروع حقيقي |
| حساب Cloudflare | الأفضل أن يكون **باسم الطبيب** ويضيفك عضوًا (**Manage Account ← Members ← Invite**) |
| الدومين | يمكن البدء بدون دومين على رابط `*.workers.dev` المجاني |

---

## 1. جهّز نسخة الطبيب من الكود

### 1.1 أنشئ مستودعًا للطبيب
- في GitHub افتح مستودعك الأساسي `docktor-site`، ثم **Use this template ← Create a new repository**. إن لم يظهر الزر: **Settings ← General ← ✔ Template repository**.
- الاسم مثل `dr-sara-alamin`، وخاص (**Private**).
- انسخه إلى جهازك، ثم:
  ```bash
  npm install --fetch-timeout=600000 --fetch-retries=5
  ```

### 1.2 عدّل إعدادات الطبيب: `src/config/doctor.config.ts`
عبّئ هذه الحقول من الاستمارة. ما لا يُعدَّل من اللوحة يجب أن يكون صحيحًا هنا:

| الحقل | من أين |
|---|---|
| `site.url` | الدومين النهائي، مثل `https://dr-sara.com` (بدون `/` في النهاية) |
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

### 1.4 أنشئ `wrangler.jsonc` في جذر المشروع (اسم الـ Worker الخاص بالطبيب)
```jsonc
{
  "name": "dr-sara-alamin",
  "compatibility_date": "2026-11-01"
}
```
> الاسم يجب أن يكون فريدًا في حساب Cloudflare: حروف إنجليزية صغيرة وأرقام وشرطات.

### 1.5 تأكد أن كل شيء يعمل محليًا
```bash
npm run build
npx astro check
```
ثم:
```bash
git add -A
git commit -m "setup: Dr. Sara Al-Amin"
git push
```

---

## 2. النشر الأول على Cloudflare

### الطريقة (أ): ربط GitHub (موصى بها، فكل `push` يُنشر تلقائيًا)
1. ادخل [dash.cloudflare.com](https://dash.cloudflare.com) ← **Workers & Pages** ← **Create** ← **Import a repository**.
2. اربط حساب GitHub واختر مستودع الطبيب.
3. الإعدادات:
   | الحقل | القيمة |
   |---|---|
   | Project name | نفس `name` في `wrangler.jsonc` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | `/` |
4. **Build variables:** أضف `NODE_VERSION` = `24`.
5. اضغط **Deploy**. أول نشر قد يفشل أو يعطي خطأ 500 لأن مفاتيح Supabase لم تُضف بعد. هذا طبيعي، أكمل الخطوة 3.

### الطريقة (ب): من جهازك بالأوامر
```bash
npx wrangler login
```
```bash
npm run build
```
```bash
npx wrangler deploy
```

---

## 3. أضف مفاتيح Supabase ⚠️ مهم جدًا

**بدون هذه الخطوة تعطي كل صفحات الموقع خطأ 500.**

في Cloudflare: **Workers & Pages ← اسم الـ Worker ← Settings ← Variables and Secrets ← Add**

| النوع | الاسم | القيمة |
|---|---|---|
| Text | `SUPABASE_URL` | `https://xxxx.supabase.co` (Supabase ← Project Settings ← API) |
| **Secret** | `SUPABASE_KEY` | المفتاح **Publishable** الذي يبدأ بـ `sb_publishable_` |

> ⛔ **لا تضع أبدًا** المفتاح `sb_secret_…` ولا `service_role`.

أو من الطرفية:
```bash
npx wrangler secret put SUPABASE_KEY
```
```bash
npx wrangler secret put SUPABASE_URL
```

بعد الإضافة: **Deployments ← Retry deployment** (الطريقة أ)، أو أعد `npx wrangler deploy` (الطريقة ب).

---

## 4. جرّب الموقع على الرابط المؤقت
افتح `https://dr-sara-alamin.<حسابك>.workers.dev` وتأكد من:
- [ ] الصفحة الرئيسية تعمل وتعرض بيانات الطبيب.
- [ ] `/dashboard` يحوّلك إلى `/login`.
- [ ] تسجيل الدخول بحساب الطبيب يعمل، وإضافة شهادة تظهر في Supabase ثم في الموقع.
- [ ] `/dev/styleguide` و`/dev/reference` تعطيان **404** (صفحات التطوير مخفية في الإنتاج).

---

## 5. ربط الدومين

### 5.1 أدخل الدومين إلى Cloudflare (مرة واحدة)
1. **Add a domain** ← اكتب الدومين ← الخطة **Free**.
2. Cloudflare يعطيك **Nameserverين**. ضعهما عند الشركة التي اشتريت منها الدومين (Namecheap، GoDaddy، …).
3. انتظر حتى تصير حالة الدومين **Active** (دقائق إلى 24 ساعة).

### 5.2 اربطه بالـ Worker
**Workers & Pages ← الـ Worker ← Settings ← Domains & Routes ← Add ← Custom domain**
- أضف `dr-sara.com`.
- وأضف `www.dr-sara.com` أيضًا.

### 5.3 وجّه `www` إلى الدومين الأساسي (مهم لـ SEO، حتى لا تظهر نسختان)
**الدومين ← Rules ← Redirect Rules ← Create rule ← Redirect from WWW to root** (قالب جاهز) ← 301.

### 5.4 حدّث Supabase
**Supabase ← Authentication ← URL Configuration**
- **Site URL:** `https://dr-sara.com`
- **Redirect URLs:** أضف `https://dr-sara.com/**`

---

## 6. الفحص بعد النشر ✅

من جهازك (في مجلد المشروع):

**فحص SEO على الموقع الحقيقي:**
```bash
npm run seo:check -- https://dr-sara.com
```
يجب أن تكون كل السطور ✅.

**فحص الأمان على قاعدة بيانات الطبيب:**
```bash
npm run verify:security
```
يجب أن تنجح الفحوصات الـ 16. يحتاج ملف `.env` ببيانات مشروع الطبيب، و`.env.test.local` ببريده وكلمة مروره، **ولا يُرفعان إلى GitHub**.

**فحص البيانات المنظمة:** الصق رابط الموقع في
- [search.google.com/test/rich-results](https://search.google.com/test/rich-results)
- [validator.schema.org](https://validator.schema.org)

**السرعة:** Chrome ← F12 ← **Lighthouse** ← Mobile. الهدف: SEO = 100.

---

## 7. محركات البحث والذكاء الاصطناعي (نقطة البيع 🚀)

1. **Google Search Console:** [search.google.com/search-console](https://search.google.com/search-console)
   - **Add property ← Domain** ← انسخ سجل TXT ← أضفه في Cloudflare (**DNS ← Records ← Add ← TXT**) ← **Verify**.
   - **Sitemaps** ← أضف `sitemap.xml` ← **Submit**.
   - **URL Inspection** ← الصفحة الرئيسية ← **Request indexing**.
2. **Bing Webmaster Tools:** [bing.com/webmasters](https://www.bing.com/webmasters) ← **Import from Google Search Console**. مهم جدًا: Bing يغذّي **ChatGPT وCopilot**.
3. **Google Business Profile** للعيادة: ضع رابط الموقع فيه. هذه أقوى إشارة للبحث المحلي («طبيب أسرة في …»).
4. تأكد أن `https://dr-sara.com/llms.txt` و`/robots.txt` يفتحان.

---

## 8. التحديثات لاحقًا
- **الطريقة (أ):** أي `git push` إلى `main` في مستودع الطبيب يُنشر تلقائيًا.
- **لنقل تحسيناتك العامة لكل الأطباء:** في مستودع الطبيب أضف المستودع الأساسي كمصدر (مرة واحدة):
  ```bash
  git remote add upstream https://github.com/mousaab37/docktor-site.git
  ```
  ثم عند كل تحديث:
  ```bash
  git pull upstream main
  ```
  ملفات الطبيب (`doctor.config.ts`، و`wrangler.jsonc`، والصور) قد تعطي تعارضًا. احتفظ بنسخة الطبيب.
- **عند تغيير `db/01-setup.sql`:** الصقه في Supabase الطبيب، ثم شغّل `03-check.sql`.

---

## 9. حل المشاكل الشائعة

| المشكلة | السبب والحل |
|---|---|
| كل الصفحات تعطي **500** | `SUPABASE_KEY` أو `SUPABASE_URL` غير موجود في Cloudflare. راجع الخطوة 3، ثم أعد النشر |
| فشل البناء: `Node version` | أضف Build variable `NODE_VERSION=24` |
| خطأ عن `SESSION` أو KV أثناء النشر | أنشئ KV: **Storage & Databases ← KV ← Create** باسم `SESSION`، واربطه بالـ Worker من **Bindings**، أو اسألني |
| الموقع يظهر بيانات تجريبية | المفاتيح غير مضبوطة، أو شُغّل `90-sample-data.sql`. احذف البيانات من Supabase |
| تسجيل الدخول يعود لصفحة الدخول | **Site URL** في Supabase غير صحيح (الخطوة 5.4)، أو حساب الطبيب ليس في `dashboard_users` (شغّل `02-add-doctor.sql`) |
| رفع الصور يفشل | تأكد أن `03-check.sql` يُظهر الحاويات الأربع |
| الروابط في جوجل تظهر بـ `workers.dev` | `site.url` في `doctor.config.ts` و`site` في `astro.config.mjs` يجب أن يكونا الدومين النهائي |
| مشروع Supabase متوقف (Paused) | **Restore project** في Supabase. المشاريع المجانية تتوقف بعد أسبوع بلا نشاط |

---

## 10. قائمة التسليم للطبيب ✔

```
[ ] الموقع يعمل على الدومين، و www يحوّل للأساسي
[ ] seo:check كله ✅ — verify:security 16/16
[ ] Search Console + Sitemap + Bing
[ ] الطبيب سجّل الدخول وغيّر كلمة المرور بنفسه
[ ] الطبيب مالك حسابات: Cloudflare + Supabase + الدومين (أو اتفاق مكتوب غير ذلك)
[ ] شرح سريع للوحة التحكم (10 دقائق): ملفي، الخدمات، العيادات، المقالات، إخفاء الأقسام
[ ] نسخة احتياطية أولى من قاعدة البيانات (Supabase ← Database ← Backups)
```
