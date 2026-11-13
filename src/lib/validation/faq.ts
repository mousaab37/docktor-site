import { z } from "zod";
import { text } from "./common";

export const faqInput = z.object({
  question: text(5, 200),
  // Plain text: line breaks are allowed, HTML is never rendered.
  answer: text(20, 1500),
  is_published: z.boolean(),
});

export type FaqInput = z.infer<typeof faqInput>;
