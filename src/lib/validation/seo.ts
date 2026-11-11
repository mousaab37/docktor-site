import { z } from "zod";
import { optText } from "./common";

export const seoInput = z.object({
  seo_title: optText(70),
  seo_description: optText(160),
  og_image: optText(500),
});

export type SeoInput = z.infer<typeof seoInput>;
