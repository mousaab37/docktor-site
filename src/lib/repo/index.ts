import { getPublicClient } from "../supabase/public";
import { onboardingProfile } from "./profile-defaults";
import { memoryRepo } from "./memory";
import { createSupabaseRepo } from "./supabase";
import type { ContentRepo } from "./types";

export type { ContentRepo } from "./types";
export { RepoError } from "./supabase";

/** A repo that shows nothing: used in production when the Supabase variables are missing. The pages hide empty sections. */
function emptyRepo(): ContentRepo {
  const table = {
    list: async () => [],
    get: async () => null,
    create: async () => {
      throw new Error("Read-only repo");
    },
    update: async () => {
      throw new Error("Read-only repo");
    },
    remove: async () => {
      throw new Error("Read-only repo");
    },
    move: async () => {},
  };
  const readOnly = async () => {
    throw new Error("Read-only repo");
  };
  return {
    statistics: table,
    certificates: table,
    services: table,
    testimonials: table,
    faqs: table,
    clinics: table,
    articles: { ...table, slugExists: async () => false },
    profile: { get: async () => onboardingProfile(), update: readOnly },
    workingHours: { listByClinic: async () => [], replaceDay: readOnly, replaceWeek: readOnly },
    seo: { list: async () => [], update: readOnly },
    images: { upload: readOnly, remove: readOnly },
  } as unknown as ContentRepo;
}

/** The public pages: the cookie-less anon client, so RLS shows only active and published rows. */
export function getPublicRepo(): ContentRepo {
  const client = getPublicClient();
  if (client) return createSupabaseRepo(client);
  // No Supabase variables: the sample data in DEV, nothing in production.
  return import.meta.env.DEV ? memoryRepo : emptyRepo();
}

/** The dashboard: the logged-in session client from the middleware, so RLS allows writes only for the doctor. */
export function getDashboardRepo(locals: App.Locals): ContentRepo {
  if (!locals.supabase) throw new Error("The dashboard needs the session client (set by the middleware)");
  return createSupabaseRepo(locals.supabase);
}
