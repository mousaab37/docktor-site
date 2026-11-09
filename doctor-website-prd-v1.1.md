# Doctor Website — Product Requirements Document (PRD)

**Version:** 1.1  
**Status:** MVP Specification  
**Date:** 2026-11-08

---

## 1. Product Overview

### 1.1 Product Description

Doctor Website is a reusable website product for individual doctors. The product is developed once as a reusable Astro codebase. Each doctor receives an independent public website deployment, Cloudflare account, Supabase project, and private dashboard.

The product targets Arabic-speaking doctors and uses an Arabic right-to-left (RTL) interface in the MVP. Doctors manage the content included in the dashboard without programming knowledge. Some initial website information and template configuration are prepared during onboarding and are not editable through the MVP dashboard.

### 1.2 Product Goals

1. Build the core website product once and reuse it for multiple doctors.
2. Make onboarding and deployment repeatable.
3. Give each doctor ownership and control of their Cloudflare and Supabase accounts.
4. Provide a private dashboard for the approved content-management functions.
5. Deliver SEO-friendly, responsive public websites.
6. Keep each doctor's website, database, and media isolated.
7. Keep infrastructure costs low where free service tiers are sufficient.

### 1.3 Product Model

Each doctor receives:

- An independent Astro website deployment.
- An independent Cloudflare account.
- An independent Supabase project.
- A private doctor login.
- A public website.
- A private dashboard.
- Independent website content and uploaded media.

The developer maintains one reusable source-code repository. The codebase is reused; doctor content and infrastructure are not shared.

---

## 2. Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | Astro | Public website and dashboard |
| Language | TypeScript | Application logic |
| Styling | Tailwind CSS | UI and responsive layouts |
| Hosting | Cloudflare Workers | Website deployment |
| Database | Supabase PostgreSQL | Doctor website content |
| Authentication | Supabase Auth | Doctor login |
| Storage | Supabase Storage | Images used by website content |
| Maps | Leaflet + OpenStreetMap | Interactive clinic maps |
| Validation | Zod | Input validation |
| Version control | Git | Source-code management |

### 2.1 Architecture Requirements

- One reusable source-code repository.
- One independent deployment per doctor.
- One Supabase project per doctor.
- No shared doctor-content database.
- No central multi-tenant database.
- No central admin dashboard in the MVP.
- Each doctor manages only the content exposed in their own dashboard.
- Initial profile information, branding, contact details, and template configuration are prepared during onboarding or deployment configuration; they are not editable dashboard sections in the MVP.

### 2.2 Rendering and SEO

The public website must return SEO-readable HTML.

Recommended implementation:

- Use Astro server-side rendering on Cloudflare Workers for dynamic public content.
- Fetch public content server-side where appropriate.
- Cache public content where safe.
- Do not publicly cache authenticated dashboard responses.
- Ensure published articles have crawlable URLs.
- Use Arabic metadata and RTL layout.
- Document cache invalidation when published content changes.

### 2.3 Environment Variables

Each doctor deployment has its own configuration, including:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (or the current Supabase publishable key)

Any Supabase secret/service-role key must remain server-side and must never be exposed to browser code. Cloudflare variables and secrets must be configured separately for each doctor deployment.

---

## 3. Users and Permissions

### 3.1 Doctor

The doctor is the only dashboard user in the MVP. The doctor can:

- Log in and log out.
- View the dashboard overview.
- Manage manually entered statistics.
- Manage certificates.
- Manage clinics and their locations.
- Manage working hours for each clinic.
- Manage blog articles.
- Manage testimonials.
- Manage SEO settings.

The doctor cannot use the MVP dashboard to edit the main doctor profile, website branding, general contact configuration, services, or a standalone media library. Those items are prepared as part of onboarding/deployment configuration or handled outside the dashboard until a future version explicitly adds them.

### 3.2 Public Visitor

A public visitor can:

- Browse public website pages.
- View the doctor's preconfigured public information.
- View configured services.
- View active certificates, clinics, working hours, and statistics.
- View published articles and testimonials.
- Contact the doctor through WhatsApp or the configured contact details.

A visitor cannot log in to the dashboard or modify website content.

### 3.3 Authentication Requirements

- Only the doctor can access the dashboard.
- Public user registration must be disabled.
- The doctor account is created during setup through Supabase Auth.
- Dashboard routes must check authentication.
- Database permissions must be enforced through Row Level Security (RLS).
- Unauthorized users must be redirected to the login page.
- Logging out must end the authenticated dashboard session.

The doctor account must be created through the Supabase Auth administrative setup process, not by directly inserting rows into Supabase Auth tables.

---

## 4. Public Website Pages

### 4.1 Home Page

Purpose: introduce the doctor and guide visitors toward services and contact.

Sections:

1. Hero: doctor name, specialty, profile image, short introduction, and primary contact action.
2. About preview with a link to the About page.
3. Manually entered statistics.
4. Featured services.
5. Clinics and location links.
6. Certificates preview.
7. Testimonials.
8. Latest articles.
9. Contact section.
10. Footer.

The content-management source for each section must follow the ownership rules in this PRD. In particular, profile, branding, and services are configured outside the MVP dashboard; statistics, certificates, clinics, testimonials, and articles are managed through their listed dashboard sections.

### 4.2 About Doctor Page

Displays the doctor's biography, specialty, education, professional experience, certificates, and configured clinic information. Main profile information is prepared during onboarding/deployment configuration and is not editable through the MVP dashboard.

### 4.3 Services Page

Displays the services configured for the doctor during onboarding/deployment configuration. The MVP dashboard does not include a Services management section. Service content changes therefore require the agreed developer-assisted configuration/update process.

A service may include a title, description, optional image, and WhatsApp contact action. Whether individual services receive dedicated detail pages is an implementation decision to be confirmed before building that route.

### 4.4 Clinics Page

Displays multiple clinics with:

- Clinic name.
- Address.
- Contact number, if configured.
- Map location.
- Working hours.
- Directions link.

Clinics and working hours are managed through the dashboard.

### 4.5 Booking / Appointment Information

The MVP does not include an automated booking engine.

The page displays clinic locations, working days, working hours, and a WhatsApp contact button. Visitors contact the clinic through WhatsApp. A prefilled message may include the selected clinic name.

The website must clearly state that sending a WhatsApp message does not automatically confirm an appointment. No appointment scheduling engine, appointment records, or automatic slot reservation are included.

### 4.6 Blog Listing Page

Displays published articles with an image, title, excerpt, publication date, and a link to the article. Categories may be added only if included in the agreed implementation scope.

### 4.7 Article Details Page

Displays the article title, featured image, publication date, article content, SEO title and description, and social-sharing metadata. Only published articles are publicly accessible.

### 4.8 Contact Page

Displays the contact details configured during onboarding, clinic addresses, clinic working hours, maps, and WhatsApp actions. These general contact details are not editable through the MVP dashboard.

### 4.9 Additional System Pages

- Privacy Policy.
- Custom 404 page.

An FAQ page is not part of the confirmed MVP scope. It can be considered in a later version if FAQ content and dashboard management are approved.

---

## 5. Doctor Dashboard

The dashboard must be private, responsive, and usable on desktop and mobile. The MVP dashboard contains **only the eight sections listed below**.

| Dashboard section | Functions |
|---|---|
| Dashboard | Display a summary and website content statistics. |
| Statistics | Add and edit manually entered statistics. |
| Certificates | Add, edit, delete, and reorder certificates and qualifications. |
| Clinics | Add clinics and edit their addresses and map locations. |
| Working Hours | Set working days and hours separately for each clinic. |
| Blog | Write, edit, publish, unpublish, and save article drafts. |
| Testimonials | Add, edit, and delete patient testimonials; manage publication status and order. |
| SEO Settings | Manage SEO settings for the website, pages, and articles. |

### 5.1 Dashboard Overview

Display a summary of relevant website content, such as:

- Number of published articles.
- Number of draft articles.
- Number of clinics.
- Number of certificates.
- Number of testimonials.
- Number of configured statistics.

These are content-management counts, not automatically calculated medical or business performance metrics.

### 5.2 Statistics

The doctor can:

- Add a statistic.
- Edit a statistic.
- Delete a statistic.
- Set its display order.
- Enable or disable its public display.

Fields:

- Label.
- Value.
- Optional description.
- Display order.
- Active status.

Statistics are entered manually. The system must not imply that they are independently verified.

### 5.3 Certificates

The doctor can:

- Add a certificate or qualification.
- Edit its information.
- Upload or replace its image within the certificate form.
- Delete it.
- Change its display order.
- Enable or disable public display.

Fields:

- Certificate title.
- Issuing organization.
- Issue date, if available.
- Certificate image, optional.
- Description, optional.
- Display order.
- Active status.

### 5.4 Clinics

The doctor can:

- Add multiple clinics.
- Edit clinic addresses and locations.
- Update clinic contact details where those fields are enabled in the form.
- Select and adjust a location on the map.
- Activate or deactivate a clinic.
- Delete a clinic, subject to safe handling of its working-hour records.

Fields:

- Clinic name.
- Address.
- Latitude.
- Longitude.
- Optional phone and WhatsApp numbers.
- Optional description.
- Active status.

#### Map Selection

Use Leaflet with OpenStreetMap tiles.

1. The doctor opens the clinic form.
2. The doctor enters the clinic address.
3. An interactive map is displayed.
4. The doctor selects the location.
5. The marker moves to the selected coordinates.
6. The doctor can adjust the marker.
7. The doctor saves the clinic.
8. Coordinates are stored in Supabase and displayed on the public website.

The map must include required OpenStreetMap attribution. Tile and geocoding providers must be selected and configured according to their usage policies. Do not assume public OSM tile or geocoding services provide unlimited production usage.

### 5.5 Working Hours

Working hours are managed separately for each clinic.

The doctor can:

- Select a weekday.
- Set opening and closing times.
- Mark a day as closed.
- Add multiple working intervals for a day when required.

The public website displays the schedule for the relevant clinic.

### 5.6 Blog

The MVP includes a basic rich-text editor that supports Arabic and RTL.

The doctor can:

- Create an article.
- Edit an article.
- Save a draft.
- Publish an article.
- Unpublish an article.
- Delete an article.
- Upload or replace a featured image within the article form.

Fields:

- Title.
- Slug.
- Excerpt.
- Featured image.
- Article body.
- Status: draft or published.
- Publication date.
- SEO title.
- SEO description.

Only published articles appear publicly. Medical content must be reviewed and approved by the doctor before publication. AI-generated medical content must never be published automatically.

### 5.7 Testimonials

Testimonials are manually managed by the doctor.

The doctor can:

- Add a testimonial.
- Edit it.
- Delete it.
- Publish or unpublish it.
- Change its display order.

Fields:

- Display name.
- Testimonial text.
- Optional date.
- Publication status.
- Display order.

The MVP does not include public review submission or an automatic review-collection system. The doctor must obtain appropriate permission before publishing identifiable patient testimonials.

### 5.8 SEO Settings

The doctor can manage SEO settings for the website, public pages, and articles, within the supported fields.

At minimum, support:

- Default website SEO title and description.
- Page-level SEO title and description where applicable.
- Article SEO title and description through the Blog editor.
- Social-sharing metadata where supported.

Technical SEO elements such as canonical URLs, sitemap, robots.txt, and structured data are generated by the application and are not necessarily editable fields in the dashboard.

### 5.9 Explicitly Excluded Dashboard Sections

The following are **not** dashboard sections in the MVP:

- Profile management.
- Website Settings for logo, colors, branding, and general contact information.
- Standalone Media Library.
- Services management.

Initial doctor profile information, branding, general contact information, and services are prepared during onboarding/deployment configuration or changed through a separately agreed developer-assisted process. Images needed for certificates and articles are uploaded from within their respective forms; there is no separate Media Library section.

---

## 6. Database Design

Each doctor has an independent Supabase project containing the same reusable schema. Since each project belongs to one doctor, the MVP does not require a shared multi-tenant `doctor_id` column in every content table.

### 6.1 Tables

#### `statistics`

- `id` (UUID, primary key)
- `label`
- `value`
- `description` (nullable)
- `display_order`
- `is_active`
- `created_at`
- `updated_at`

#### `certificates`

- `id` (UUID, primary key)
- `title`
- `issuing_organization` (nullable)
- `issue_date` (nullable)
- `description` (nullable)
- `image_path` (nullable)
- `display_order`
- `is_active`
- `created_at`
- `updated_at`

#### `clinics`

- `id` (UUID, primary key)
- `name`
- `address`
- `phone` (nullable)
- `whatsapp` (nullable)
- `latitude` (nullable)
- `longitude` (nullable)
- `description` (nullable)
- `is_active`
- `created_at`
- `updated_at`

#### `working_hours`

- `id` (UUID, primary key)
- `clinic_id` (foreign key to `clinics.id`)
- `weekday`
- `opening_time` (nullable when closed)
- `closing_time` (nullable when closed)
- `is_closed`
- `interval_order`
- `created_at`
- `updated_at`

A clinic can have multiple working-hour intervals per weekday.

#### `articles`

- `id` (UUID, primary key)
- `title`
- `slug`
- `excerpt` (nullable)
- `content`
- `featured_image` (nullable)
- `seo_title` (nullable)
- `seo_description` (nullable)
- `status` (`draft` / `published`)
- `published_at` (nullable)
- `created_at`
- `updated_at`

Article slugs must be unique within the project.

#### `testimonials`

- `id` (UUID, primary key)
- `display_name`
- `content`
- `testimonial_date` (nullable)
- `is_published`
- `display_order`
- `created_at`
- `updated_at`

#### `seo_settings`

Stores the editable SEO defaults and any supported page-level SEO configuration not stored directly on articles.

Suggested fields:

- `id` (UUID, primary key)
- `scope` (for example: `global` or a supported page key)
- `seo_title` (nullable)
- `seo_description` (nullable)
- `updated_at`

The exact page-key strategy and uniqueness constraints must be finalized during implementation.

### 6.2 Configuration Outside the Dashboard

The following information is not managed through MVP dashboard sections:

- Main doctor profile and biography.
- Main profile image.
- General branding and logo.
- Global colors and template configuration.
- General contact details and social links.
- Services content.

Store this information in a deployment-specific configuration file or another documented onboarding mechanism. Do not add editable dashboard sections for these items in the MVP. If a database-backed configuration is selected, it must still be maintained outside the doctor dashboard unless the scope is explicitly changed.

### 6.3 Database Rules

- Use UUID primary keys.
- Use foreign keys for relationships.
- Use timestamps for created and updated records.
- Add indexes for frequently queried fields.
- Add unique constraints for article slugs.
- Validate weekdays and time values.
- Handle clinic deletion safely when dependent working-hour records exist.
- Validate incoming data in both the application and database where appropriate.

### 6.4 SQL Setup File

A reusable `setup.sql` file must:

1. Create all MVP tables.
2. Create primary and foreign keys.
3. Create indexes and constraints.
4. Enable RLS.
5. Define database policies.
6. Create required database functions and triggers.
7. Create/configure required Storage buckets and policies where supported by SQL setup.

The setup must be idempotent where practical, or include explicit safe setup instructions. The doctor Auth account must be created separately through Supabase Auth.

---

## 7. Security and Access Control

### 7.1 Row Level Security

RLS must be enabled on all tables exposed through the Supabase Data API.

- Only the authenticated doctor can insert, update, or delete dashboard-managed content.
- Public visitors can read content intended for public display.
- Public visitors cannot modify records.
- Draft articles must never be publicly readable.
- Storage access must follow equivalent visibility and ownership rules.
- Frontend route protection alone is insufficient; database policies must enforce access.

### 7.2 Public Content

Public read access is limited to:

- Active statistics.
- Active certificates.
- Active clinics.
- Working hours associated with active clinics.
- Published articles.
- Published testimonials.
- Public SEO metadata required to render pages.

Deployment-configured profile, branding, contact information, and services may be rendered publicly from the configured source. Sensitive account or administrative information must never be exposed.

### 7.3 Secrets

- Never expose the Supabase service-role key in browser code.
- Never commit secrets to Git.
- Use environment variables and Cloudflare secrets.
- Validate authenticated users on protected server operations.
- Do not store patient medical records in the MVP.

### 7.4 Authentication and Authorization Tests

Verify that:

- Anonymous visitors cannot access dashboard pages or operations.
- Anonymous visitors cannot modify database content.
- The authenticated doctor can manage their own project's content.
- Draft articles cannot be accessed publicly.
- Unauthorized Storage operations are rejected.

---

## 8. Storage Management

Use Supabase Storage for images required by supported content forms, including:

- Certificate images.
- Article featured images.
- Other images explicitly required by an approved MVP content field.

There is no standalone Media Library dashboard section. Upload, replacement, and removal actions are performed from the relevant content form, such as Certificates or Blog.

Requirements:

- Validate file type and size.
- Use safe file names and paths.
- Restrict upload and delete permissions to the authenticated doctor.
- Allow public reading only for media intended for public website display.
- Clean up replaced or deleted files safely to avoid orphaned storage objects.
- Document bucket structure and policies.

---

## 9. WhatsApp Contact Flow

The MVP uses WhatsApp rather than an automated appointment engine.

Requirements:

- Display WhatsApp actions on relevant public pages.
- Support a clinic-specific WhatsApp number.
- If a clinic-specific number is not configured, use the main configured WhatsApp number where available.
- Support a prefilled message.
- Include the clinic name in the message where appropriate.
- Open WhatsApp using a valid `wa.me` link.

No appointment records are required. A WhatsApp message does not confirm a booking.

---

## 10. SEO Requirements

Every doctor website must support:

- Arabic page titles and meta descriptions.
- Canonical URLs.
- XML sitemap.
- `robots.txt`.
- Open Graph metadata.
- Clean URLs.
- Semantic HTML.
- Image alt text.
- Responsive design and good loading performance.
- Structured data appropriate to verified doctor and clinic information.

The dashboard exposes the SEO Settings section for supported editable SEO values. Technical SEO files and metadata generation are handled by the application.

Do not generate fake reviews, qualifications, medical credentials, or unsupported claims. Do not promise specific Google rankings or guaranteed search visibility.

---

## 11. Performance and Reliability

Requirements:

- Mobile-first responsive design.
- Optimize and compress images.
- Lazy-load images where appropriate.
- Minimize unnecessary JavaScript.
- Cache public content where safe.
- Never publicly cache authenticated dashboard responses.
- Handle database failures gracefully.
- Display useful loading, success, and error states.
- Prevent data loss during content editing.
- Keep the public website usable when dashboard authentication is unavailable, provided public content services remain operational.

---

## 12. New Doctor Setup Workflow

### Step 1 — Prepare Doctor Configuration

Collect and verify the information needed for the initial website configuration, including:

- Doctor name and specialty.
- Biography and professional information.
- Profile image.
- General contact details.
- Branding assets and approved template configuration.
- Initial services content.
- Initial clinic details.

The initial configuration process is separate from dashboard management.

### Step 2 — Create Accounts

The doctor creates or owns:

- Cloudflare account.
- Supabase account.
- Required GitHub access or another approved deployment access method.

The exact account-creation and access workflow must be documented.

### Step 3 — Create Supabase Project

- Create a new Supabase project.
- Run `setup.sql`.
- Create the doctor Auth account.
- Disable public signups.
- Configure Storage buckets and policies.
- Record the project URL and public/anonymous key securely.

### Step 4 — Configure Website

- Set doctor-specific environment variables.
- Apply the doctor-specific configuration.
- Confirm Arabic RTL behavior.
- Verify initial profile, branding, contact, and services content.

### Step 5 — Deploy to Cloudflare

- Deploy the reusable Astro codebase.
- Configure Cloudflare environment variables and secrets.
- Confirm the site loads.
- Confirm the website can access the doctor's Supabase project.

### Step 6 — Connect Domain

Connect the doctor's domain if purchased and configured. A Cloudflare-provided subdomain may be used during initial testing. Domain purchase and renewal responsibilities must be agreed separately.

### Step 7 — Final Verification

Verify:

- Public pages and configured content.
- Doctor login and logout.
- Dashboard access control.
- Statistics management.
- Certificates management and image uploads.
- Clinics and map locations.
- Working hours per clinic.
- Blog drafts and publication.
- Testimonials management.
- SEO settings and generated metadata.
- WhatsApp actions.
- Responsive layout and Arabic RTL.

### Step 8 — Handover

The doctor must receive access to their own accounts and dashboard. Account ownership, developer access, licensing, and ongoing support must be agreed explicitly. The developer must not retain account ownership without an agreed arrangement.

---

## 13. Supabase Activity Monitoring

Supabase Free projects may be paused after periods of inactivity under the applicable plan rules.

The product may include a scheduled Cloudflare Worker that performs a lightweight, legitimate health/activity check.

Requirements:

- Use a scheduled trigger.
- Make a minimal request.
- Avoid unnecessary writes.
- Record monitoring success and failure.
- Alert the operator or doctor when connectivity fails, if an alert channel is configured.
- Do not claim that monitoring guarantees protection from inactivity pausing.

Test the mechanism against the current Supabase plan behavior. Document the recovery process for a paused project. Monitoring is operational assistance, not a substitute for a paid plan or backup strategy.

---

## 14. Backup and Recovery

The MVP must include a documented backup process.

Requirements:

- Provide a way to export database data.
- Document how to export Storage files.
- Store backup copies outside the live Supabase project.
- Document database restoration.
- Document Storage restoration.
- Test restoration before production handover.

Free-tier hosting is not a substitute for a backup strategy.

---

## 15. MVP Scope

### Included

- One reusable Astro template.
- Arabic RTL public website.
- Home page.
- About page using onboarding-configured doctor information.
- Services pages using onboarding-configured services content.
- Multiple clinics.
- Clinic map.
- Clinic-specific working hours.
- WhatsApp contact and appointment-information flow.
- Blog listing and article details.
- Basic Arabic/RTL rich-text article editor.
- Manual statistics management.
- Certificate management.
- Manual testimonials management.
- Doctor dashboard with exactly the eight sections in Section 5.
- Doctor-only authentication.
- Supabase database and SQL setup.
- Supabase Storage for relevant content forms.
- Cloudflare deployment.
- SEO Settings dashboard section and technical SEO output.
- Responsive design.

### Excluded

- Multi-tenant platform.
- Central admin dashboard.
- Multiple doctors in one Supabase project.
- Dashboard Profile management.
- Dashboard Website Settings for branding, colors, logo, or general contact details.
- Standalone Dashboard Media Library.
- Dashboard Services management.
- Automated appointment scheduling.
- Calendar synchronization.
- Online payments.
- Patient accounts.
- Patient medical records.
- Prescription management.
- Medical chat.
- Public review submission.
- Automatic statistics calculation.
- AI medical article generation or automatic publication.
- Multiple selectable website templates.
- Native mobile application.
- FAQ management unless separately approved.

---

## 16. Acceptance Criteria

The MVP is accepted when:

1. A new doctor website can be created from the reusable codebase.
2. Each doctor has a separate Cloudflare account and deployment.
3. Each doctor has a separate Supabase project.
4. The doctor can log in to the dashboard.
5. Anonymous visitors cannot access dashboard functionality.
6. Only the authenticated doctor can change dashboard-managed content.
7. The dashboard contains exactly: Dashboard, Statistics, Certificates, Clinics, Working Hours, Blog, Testimonials, and SEO Settings.
8. No Profile, Website Settings, Media Library, or Services management section appears in the MVP dashboard.
9. The doctor can add and edit statistics.
10. The doctor can add, edit, delete, and reorder certificates.
11. The doctor can create multiple clinics and save map coordinates.
12. The doctor can manage working hours separately for each clinic.
13. The doctor can create, edit, draft, publish, unpublish, and delete articles.
14. The doctor can manage testimonials manually.
15. Public pages display only content that is intended to be public and is active/published as applicable.
16. WhatsApp actions work correctly and do not imply automatic appointment confirmation.
17. Images can be uploaded from the relevant content forms without a standalone Media Library.
18. SEO settings and technical SEO output work as specified.
19. The website works on mobile and desktop.
20. Arabic RTL layouts display correctly.
21. RLS and Storage policies prevent unauthorized modifications.
22. A documented backup and recovery process exists.
23. A repeatable doctor setup and handover guide is available.

---

## 17. Open Decisions — Do Not Assume

The following decisions are not finalized:

1. **Domain ownership and payment:** Who purchases and renews the doctor's domain?
2. **GitHub ownership:** Does the doctor own a repository copy, or is deployment managed through another approved method?
3. **Deployment method:** Git integration, automated deployment, or manual deployment?
4. **Clinic map providers:** Which tile and geocoding providers will be used in production?
5. **Backup frequency:** How often should backups be generated?
6. **Email delivery:** Are email notifications needed, and which provider will be used?
7. **Languages:** The MVP baseline is Arabic; additional languages are excluded unless approved.
8. **Commercial support:** What support and maintenance are included after handover?
9. **Account setup:** Will the doctor create accounts independently, or will the developer guide the process?
10. **Subscription model:** Is ongoing maintenance or hosting support optional, and how is it priced?
11. **Service detail pages:** Will each configured service have a dedicated public detail page, or will services appear only in listing/summary sections?
12. **SEO page-level controls:** Which non-article pages expose individual editable SEO fields in the dashboard?

These decisions must be resolved before implementing dependent features.

---

## 18. Suggested Development Phases

### Phase 1 — Foundation

- Initialize Astro project.
- Configure TypeScript and Tailwind.
- Build the Arabic RTL design system.
- Create reusable layouts and components.
- Configure Cloudflare deployment.

### Phase 2 — Database and Authentication

- Create the SQL setup file.
- Implement tables, relationships, indexes, and constraints.
- Implement RLS policies.
- Configure Supabase Auth.
- Implement doctor login and logout.
- Protect dashboard routes.

### Phase 3 — Doctor Dashboard

- Dashboard overview.
- Statistics.
- Certificates.
- Clinics.
- Working Hours.
- Blog.
- Testimonials.
- SEO Settings.

Do not add Profile, Website Settings, Media Library, or Services management sections in this MVP phase.

### Phase 4 — Public Website

- Home.
- About.
- Services using deployment-configured content.
- Clinics.
- Appointment information.
- Blog listing and article details.
- Contact.
- Privacy Policy.
- 404 page.

### Phase 5 — Integration

- Connect dashboard sections to Supabase.
- Connect public pages to public/active/published content.
- Implement contextual image uploads.
- Implement clinic maps.
- Implement WhatsApp actions.
- Implement SEO.

### Phase 6 — Deployment and Testing

- Deploy an independent test doctor website.
- Verify account and data isolation.
- Test RLS and Storage policies.
- Test mobile responsiveness and Arabic RTL.
- Test SEO output.
- Test backup and recovery.
- Document doctor setup and handover.

---

## 19. Final Product Principle

**Build once. Configure per doctor. Deploy independently. Keep each doctor's accounts and data separate.**

The developer maintains the reusable product codebase. Each doctor controls their own deployed website, Cloudflare account, Supabase project, and dashboard-managed content, subject to the agreed licensing and support terms.

The MVP dashboard scope is intentionally limited to these eight sections: **Dashboard, Statistics, Certificates, Clinics, Working Hours, Blog, Testimonials, and SEO Settings.**
