import type { ContentRepo, ImageBucket } from "../repo/types";

export interface ImageChange {
  /** The value to store in the row (a path or URL), or null for "no image". */
  path: string | null;
  /** An Arabic error message when the upload was refused (type or size). */
  error?: string;
  /** The old image to delete after the row has been saved, when it was replaced or removed. */
  oldToRemove?: string;
}

/**
 * Reads the image fields of a form and decides what to do with the stored image.
 * Field names: `<field>_file` (the new file) and `<field>_remove` (the "remove image" checkbox).
 *  - a new file (size > 0): upload it (the repo checks type and size again on the server)
 *  - "remove" ticked: no image
 *  - otherwise: keep `current`, which must come from the stored row and never from the form
 */
export async function applyImageChange(
  repo: ContentRepo,
  bucket: ImageBucket,
  fd: FormData,
  field: string,
  current: string | null,
): Promise<ImageChange> {
  const file = fd.get(`${field}_file`);
  if (file instanceof File && file.size > 0) {
    try {
      const path = await repo.images.upload(bucket, file);
      return { path, oldToRemove: current ?? undefined };
    } catch (e) {
      return { path: current, error: e instanceof Error ? e.message : "تعذّر رفع الصورة" };
    }
  }
  if (fd.has(`${field}_remove`)) return { path: null, oldToRemove: current ?? undefined };
  return { path: current };
}
