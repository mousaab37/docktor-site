import { z } from "zod";
import { optText, text } from "./common";

export const serviceInput = z.object({
  title: text(1, 80),
  description: text(1, 300),
  image_path: optText(500),
  is_active: z.boolean(),
  is_featured: z.boolean(),
}).superRefine((v, ctx) => {
  // Only a visible service can be the featured one.
  if (v.is_featured && !v.is_active) {
    ctx.addIssue({ code: "custom", path: ["is_featured"], message: "لا يمكن جعل خدمة مخفية مميزة" });
  }
});

export type ServiceInput = z.infer<typeof serviceInput>;
