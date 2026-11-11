import { memoryRepo } from "./memory";
import type { ContentRepo } from "./types";

export type { ContentRepo } from "./types";

export function getRepo(): ContentRepo {
  // task 17: return the Supabase repo when configured
  return memoryRepo;
}
