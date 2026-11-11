import { z } from "zod";
import { optText, text } from "./common";

export const articleInput = z.object({
  title: text(1, 200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "الرابط: أحرف لاتينية صغيرة وأرقام وشرطات فقط"),
  excerpt: optText(300),
  content: z.string().max(200000).default(""),
  featured_image: optText(500),
  seo_title: optText(70),
  seo_description: optText(160),
  status: z.enum(["draft", "published"]),
});

export type ArticleInput = z.infer<typeof articleInput>;
