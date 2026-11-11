import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "الوقت بصيغة HH:MM");

/** One weekday of one clinic. weekday: 0 = Sunday ... 6 = Saturday. */
export const dayScheduleInput = z
  .object({
    weekday: z.number().int().min(0).max(6),
    closed: z.boolean(),
    intervals: z.array(z.object({ from: time, to: time })).max(3, "الحد الأقصى 3 فترات في اليوم"),
  })
  .superRefine((d, ctx) => {
    if (d.closed) {
      if (d.intervals.length > 0) {
        ctx.addIssue({ code: "custom", path: ["intervals"], message: "اليوم المغلق لا يحتوي على فترات" });
      }
      return;
    }
    if (d.intervals.length === 0) {
      ctx.addIssue({ code: "custom", path: ["intervals"], message: "أضف فترة واحدة على الأقل" });
      return;
    }
    d.intervals.forEach((iv, i) => {
      if (iv.from >= iv.to) {
        ctx.addIssue({ code: "custom", path: ["intervals", i, "to"], message: "وقت الإغلاق يجب أن يكون بعد وقت الفتح" });
      }
      const prev = d.intervals[i - 1];
      if (prev && iv.from < prev.to) {
        ctx.addIssue({ code: "custom", path: ["intervals", i, "from"], message: "الفترات متداخلة أو غير مرتبة" });
      }
    });
  });

export type DayScheduleInput = z.infer<typeof dayScheduleInput>;
