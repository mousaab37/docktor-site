// Turns a stored image value into a URL the browser can load.
import { SUPABASE_URL } from "astro:env/server";

export type StorageBucket = "certificates" | "articles" | "profile" | "services";

/**
 * null stays null; a value that starts with "/", "http" or "data:" is already a URL (sample data) and stays as it is;
 * anything else is a path inside a public Supabase Storage bucket.
 */
export function publicImageUrl(path: string | null | undefined, bucket: StorageBucket): string | null {
  if (!path) return null;
  if (path.startsWith("/") || path.startsWith("http") || path.startsWith("data:")) return path;
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
