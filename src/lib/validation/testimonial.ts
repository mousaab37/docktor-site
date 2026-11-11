import { z } from "zod";
import { optDate, text } from "./common";

export const testimonialInput = z.object({
  display_name: text(1, 80),
  content: text(1, 1000),
  testimonial_date: optDate,
  is_published: z.boolean(),
});

export type TestimonialInput = z.infer<typeof testimonialInput>;
