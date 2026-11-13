import { z } from "zod";
import { optText, text } from "./common";

export const serviceInput = z.object({
  title: text(1, 80),
  description: text(1, 300),
  image_path: optText(500),
  is_active: z.boolean(),
  is_featured: z.boolean(),
});

export type ServiceInput = z.infer<typeof serviceInput>;
