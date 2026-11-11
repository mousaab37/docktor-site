import { z } from "zod";

/** Required text, trimmed, with a length range (mirrors the database `char_length` checks). */
export const text = (min: number, max: number) => z.string().trim().min(min).max(max);

/** Optional text, trimmed, with a maximum length. `null` clears the value. */
export const optText = (max: number) => z.string().trim().max(max).nullish();

/** Optional date `YYYY-MM-DD`. */
export const optDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ غير صالح")
  .refine((v) => !Number.isNaN(Date.parse(v)), "تاريخ غير صالح")
  .nullish();
