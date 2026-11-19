// Security verification (PRD §7.4): proves the database rules hold on the doctor's Supabase project.
// Run:  npm run verify:security
// Uses ONLY the publishable (anon) key and, for the "as doctor" checks, the doctor's test login in .env.test.local.
// Every row or file it creates is named `__verify__…` and is deleted at the end, even when a check fails.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Only what this script uses from Node (the project does not install @types/node).
declare const process: {
  env: Record<string, string | undefined>;
  loadEnvFile(path: string): void;
  exit(code: number): never;
};

function loadEnv(file: string): void {
  try {
    process.loadEnvFile(file);
  } catch {
    // The file does not exist: fine.
  }
}
loadEnv(".env");
loadEnv(".env.test.local");

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_KEY;
const DOCTOR_EMAIL = process.env.TEST_DOCTOR_EMAIL;
const DOCTOR_PASSWORD = process.env.TEST_DOCTOR_PASSWORD;

if (!URL_ || !KEY) {
  console.error("❌ SUPABASE_URL and SUPABASE_KEY are missing (.env).");
  process.exit(1);
}
if (KEY.startsWith("sb_secret_")) {
  console.error("❌ SUPABASE_KEY must be the publishable key, never the secret / service-role key.");
  process.exit(1);
}

const make = (): SupabaseClient =>
  createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

// A valid 1x1 PNG.
const PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="),
  (c) => c.charCodeAt(0),
);
const pngBlob = () => new Blob([PNG], { type: "image/png" });

const TAG = "__verify__";
// LIKE pattern for the tag ("_" is a wildcard in LIKE, so it is escaped).
const LIKE_TAG = "\\_\\_verify\\_\\_%";
let passed = 0;
let failed = 0;
let skipped = 0;

type Result = true | string; // true = ok, a string = why it failed
async function check(name: string, run: () => Promise<Result>): Promise<void> {
  try {
    const r = await run();
    if (r === true) {
      passed++;
      console.log(`✅ ${name}`);
    } else {
      failed++;
      console.log(`❌ ${name}\n     ${r}`);
    }
  } catch (e) {
    failed++;
    console.log(`❌ ${name}\n     threw: ${e instanceof Error ? e.message : String(e)}`);
  }
}
function skip(name: string, why: string): void {
  skipped++;
  console.log(`⏭  ${name} (skipped: ${why})`);
}

const anon = make();
let doctor: SupabaseClient | null = null;

/** Deletes everything this script may have created. Safe to call at the start and at the end. */
async function cleanup(client: SupabaseClient | null): Promise<void> {
  if (!client) return;
  const tries: (() => PromiseLike<unknown>)[] = [
    () => client.from("statistics").delete().like("label", LIKE_TAG),
    () => client.from("articles").delete().like("title", LIKE_TAG),
    () => client.storage.from("certificates").remove([`${TAG}.png`, `${TAG}.txt`]),
  ];
  for (const t of tries) {
    try {
      await t();
    } catch {
      // keep going
    }
  }
}

try {
  // ---- Sign in as the doctor (when the test login exists) --------------------------------------------------------
  if (DOCTOR_EMAIL && DOCTOR_PASSWORD) {
    const c = make();
    const { error } = await c.auth.signInWithPassword({ email: DOCTOR_EMAIL, password: DOCTOR_PASSWORD });
    if (error) {
      console.log(`❌ Could not sign in with the test login: ${error.message}`);
      failed++;
    } else {
      doctor = c;
      await cleanup(doctor); // leftovers of an interrupted run
    }
  } else {
    console.log("ℹ️  .env.test.local not found (TEST_DOCTOR_EMAIL / TEST_DOCTOR_PASSWORD): the 'as doctor' checks are skipped.\n");
  }

  // The draft for check 1: created as the doctor when possible, otherwise the seed draft is used.
  let draftSlug = "unpublished-draft";
  if (doctor) {
    const { error } = await doctor
      .from("articles")
      .insert({ title: `${TAG} draft for check 1`, slug: "verify-security-draft-1", status: "draft", content: "x" });
    if (!error) draftSlug = "verify-security-draft-1";
  }

  console.log("Anonymous checks");
  await check("1. anon cannot read draft articles", async () => {
    const { data, error } = await anon.from("articles").select("slug, status");
    if (error) return error.message;
    const drafts = data.filter((r) => r.status === "draft" || r.slug === draftSlug);
    return drafts.length === 0 ? true : `anon saw ${drafts.length} draft(s)`;
  });

  await check("2. anon cannot read inactive statistics, certificates or clinics", async () => {
    for (const table of ["statistics", "certificates", "clinics"]) {
      const { data, error } = await anon.from(table).select("id").eq("is_active", false);
      if (error) return `${table}: ${error.message}`;
      if (data.length) return `${table}: anon saw ${data.length} inactive row(s)`;
    }
    return true;
  });

  await check("3. anon cannot read unpublished testimonials", async () => {
    const { data, error } = await anon.from("testimonials").select("id").eq("is_published", false);
    if (error) return error.message;
    return data.length === 0 ? true : `anon saw ${data.length} unpublished testimonial(s)`;
  });

  const { data: visibleClinics } = await anon.from("clinics").select("id");
  const visibleIds = new Set((visibleClinics ?? []).map((c) => c.id as string));

  await check("4. anon cannot read working hours of inactive clinics", async () => {
    const { data, error } = await anon.from("working_hours").select("clinic_id");
    if (error) return error.message;
    const bad = data.filter((r) => !visibleIds.has(r.clinic_id as string));
    return bad.length === 0 ? true : `anon saw ${bad.length} hour row(s) of hidden clinics`;
  });

  await check("5. anon cannot insert into any content table", async () => {
    const clinicId = [...visibleIds][0] ?? "00000000-0000-4000-8000-000000000021";
    const attempts: [string, Record<string, unknown>][] = [
      ["statistics", { label: `${TAG} a`, value: "1" }],
      ["certificates", { title: `${TAG} a` }],
      ["clinics", { name: `${TAG} a`, address: "x" }],
      ["working_hours", { clinic_id: clinicId, weekday: 0, opening_time: "09:00", closing_time: "10:00", interval_order: 9 }],
      ["articles", { title: `${TAG} a`, slug: "verify-security-anon", status: "draft", content: "x" }],
      ["testimonials", { display_name: `${TAG} a`, content: "x" }],
      ["seo_settings", { scope: "global" }],
      ["services", { title: `${TAG} a`, description: "x" }],
      ["faqs", { question: `${TAG} question`, answer: `${TAG} answer answer answer` }],
      ["profile", { id: 2 }],
    ];
    const worked: string[] = [];
    for (const [table, row] of attempts) {
      const { data, error } = await anon.from(table).insert(row).select();
      if (!error && data && data.length > 0) worked.push(table);
    }
    return worked.length === 0 ? true : `anon could insert into: ${worked.join(", ")}`;
  });

  await check("6. anon update changes 0 rows", async () => {
    const { data: rows } = await anon.from("statistics").select("id, label").limit(1);
    const row = rows?.[0];
    if (!row) return "no statistics row to test with (run db/90-sample-data.sql)";
    await anon.from("statistics").update({ label: `${TAG} changed` }).eq("id", row.id);
    const { data: after } = await anon.from("statistics").select("label").eq("id", row.id).single();
    return after?.label === row.label ? true : `label changed to "${after?.label}"`;
  });

  await check("7. anon delete removes 0 rows", async () => {
    const { data: rows } = await anon.from("clinics").select("id").limit(1);
    const row = rows?.[0];
    if (!row) return "no clinic row to test with (run db/90-sample-data.sql)";
    await anon.from("clinics").delete().eq("id", row.id);
    const { data: after } = await anon.from("clinics").select("id").eq("id", row.id);
    return after && after.length === 1 ? true : "the clinic row is gone";
  });

  await check("8. anon cannot read dashboard_users", async () => {
    const { data, error } = await anon.from("dashboard_users").select("*");
    if (error) return true;
    return !data || data.length === 0 ? true : `anon read ${data.length} row(s)`;
  });

  await check("9. anon cannot upload to the certificates bucket", async () => {
    const { error } = await anon.storage.from("certificates").upload(`${TAG}-anon.png`, pngBlob(), { contentType: "image/png" });
    if (error) return true;
    return "the upload succeeded";
  });

  await check("10. is_dashboard_user() is false for anon", async () => {
    const { data, error } = await anon.rpc("is_dashboard_user");
    if (error) return error.message;
    return data === false ? true : `returned ${String(data)}`;
  });

  console.log("\nDoctor checks");
  const doctorChecks: [string, (d: SupabaseClient) => Promise<Result>][] = [
    [
      "11. is_dashboard_user() is true for the doctor",
      async (d) => {
        const { data, error } = await d.rpc("is_dashboard_user");
        if (error) return error.message;
        return data === true ? true : `returned ${String(data)} (is the user in dashboard_users?)`;
      },
    ],
    [
      "12. doctor can insert, update and delete a row",
      async (d) => {
        const ins = await d.from("statistics").insert({ label: `${TAG} stat`, value: "1" }).select("id").single();
        if (ins.error) return `insert: ${ins.error.message}`;
        const id = ins.data.id as string;
        const upd = await d.from("statistics").update({ label: `${TAG} stat 2` }).eq("id", id).select("label");
        if (upd.error || upd.data?.[0]?.label !== `${TAG} stat 2`) return `update: ${upd.error?.message ?? "0 rows changed"}`;
        const del = await d.from("statistics").delete().eq("id", id).select("id");
        if (del.error || del.data?.length !== 1) return `delete: ${del.error?.message ?? "0 rows deleted"}`;
        return true;
      },
    ],
    [
      "13. draft article: hidden from anon, then published_at is set and anon sees it",
      async (d) => {
        const slug = "verify-security-draft-2";
        const ins = await d.from("articles").insert({ title: `${TAG} article`, slug, status: "draft", content: "x" }).select("id, published_at").single();
        if (ins.error) return `insert: ${ins.error.message}`;
        const id = ins.data.id as string;
        if (ins.data.published_at !== null) return "a draft got a published_at";
        const seenByAnon = await anon.from("articles").select("id").eq("slug", slug);
        if (seenByAnon.data?.length) return "anon can see the draft";
        const seenByDoctor = await d.from("articles").select("id").eq("slug", slug);
        if (!seenByDoctor.data?.length) return "the doctor cannot see the draft";
        const pub = await d.from("articles").update({ status: "published" }).eq("id", id).select("published_at").single();
        if (pub.error || !pub.data?.published_at) return `publish: ${pub.error?.message ?? "published_at was not set by the trigger"}`;
        const nowAnon = await anon.from("articles").select("id").eq("slug", slug);
        if (!nowAnon.data?.length) return "anon cannot see the published article";
        await d.from("articles").delete().eq("id", id);
        return true;
      },
    ],
    [
      "14. doctor can upload, read publicly and delete an image",
      async (d) => {
        const path = `${TAG}.png`;
        const up = await d.storage.from("certificates").upload(path, pngBlob(), { contentType: "image/png", upsert: true });
        if (up.error) return `upload: ${up.error.message}`;
        const url = d.storage.from("certificates").getPublicUrl(path).data.publicUrl;
        const res = await fetch(url);
        const status = res.status;
        const rm = await d.storage.from("certificates").remove([path]);
        if (status !== 200) return `the public URL answered ${status}`;
        if (rm.error) return `delete: ${rm.error.message}`;
        return true;
      },
    ],
    [
      "15. a .txt upload to certificates is refused",
      async (d) => {
        const up = await d.storage.from("certificates").upload(`${TAG}.txt`, new Blob(["hello"], { type: "text/plain" }), { contentType: "text/plain" });
        if (up.error) return true;
        await d.storage.from("certificates").remove([`${TAG}.txt`]);
        return "the .txt upload succeeded";
      },
    ],
    [
      "16. working hours with opening after closing are refused",
      async (d) => {
        const { data: clinics } = await d.from("clinics").select("id").limit(1);
        const clinicId = clinics?.[0]?.id as string | undefined;
        if (!clinicId) return "no clinic to test with (run db/90-sample-data.sql)";
        const ins = await d
          .from("working_hours")
          .insert({ clinic_id: clinicId, weekday: 0, opening_time: "18:00", closing_time: "09:00", interval_order: 9 })
          .select("id");
        if (ins.error) return true;
        await d.from("working_hours").delete().in("id", (ins.data ?? []).map((r) => r.id as string));
        return "the bad hours were accepted";
      },
    ],
  ];
  for (const [name, run] of doctorChecks) {
    if (doctor) await check(name, () => run(doctor as SupabaseClient));
    else skip(name, "no .env.test.local");
  }
} finally {
  await cleanup(doctor);
  if (doctor) {
    // A last look: nothing named __verify__ may be left.
    const left = await doctor.from("statistics").select("id").like("label", LIKE_TAG);
    const leftArticles = await doctor.from("articles").select("id").like("title", LIKE_TAG);
    const leftFiles = await doctor.storage.from("certificates").list("", { search: TAG });
    const n = (left.data?.length ?? 0) + (leftArticles.data?.length ?? 0) + (leftFiles.data?.length ?? 0);
    console.log(n === 0 ? "\n🧹 Nothing left behind." : `\n⚠️  ${n} __verify__ item(s) are still there: delete them in the Supabase UI.`);
    if (n > 0) failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed, ${skipped} skipped.`);
process.exit(failed > 0 ? 1 : 0);
