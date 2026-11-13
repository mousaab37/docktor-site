import type { ContentRepo } from "../repo/types";
import { sanitizeArticleHtml } from "../sanitize";
import type { Article } from "../types";
import { articleInput } from "../validation/article";
import { parseForm, type FormValues } from "../validation/form";
import { applyImageChange } from "./images";

export type SaveArticleResult =
  | { ok: true; article: Article }
  | { ok: false; values: FormValues; errors: Record<string, string> };

/**
 * Saves the article form (new or existing). `intent` decides the status:
 * publish -> published; draft and unpublish -> draft. The repo sets `published_at` the first time.
 * The content is sanitized here, before it is stored; the current image comes from the stored row, never from the form.
 */
export async function saveArticle(repo: ContentRepo, fd: FormData, current: Article | null): Promise<SaveArticleResult> {
  const intent = String(fd.get("intent") ?? "draft");
  const status = intent === "publish" ? "published" : "draft";

  const parsed = parseForm(articleInput, fd, { raw: { status } });
  const errors: Record<string, string> = parsed.ok ? {} : { ...parsed.errors };

  if (parsed.ok && (await repo.articles.slugExists(parsed.data.slug, current?.id))) {
    errors.slug = "هذا الرابط مستخدم في مقال آخر";
  }
  if (!parsed.ok || errors.slug) return { ok: false, values: parsed.values, errors };

  // Validated: now the image (so a refused form never leaves an orphan file).
  const image = await applyImageChange(repo, "articles", fd, "image", current?.featured_image ?? null);
  if (image.error) return { ok: false, values: parsed.values, errors: { image: image.error } };

  const data = { ...parsed.data, content: sanitizeArticleHtml(parsed.data.content), featured_image: image.path };
  const article = current ? await repo.articles.update(current.id, data) : await repo.articles.create(data);
  if (image.oldToRemove) await repo.images.remove("articles", image.oldToRemove);
  return { ok: true, article };
}
