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
        ctx.addIssue({ code: "custom", path: ["intervals", i, "to"], message: "وقت البداية يجب أن يكون قبل النهاية" });
      }
      const prev = d.intervals[i - 1];
      if (prev && iv.from < prev.to) {
        ctx.addIssue({ code: "custom", path: ["intervals", i, "from"], message: "الفترات متداخلة" });
      }
    });
  });

export type DayScheduleInput = z.infer<typeof dayScheduleInput>;

/** A whole week: exactly 7 days, one per weekday 0-6 (no repeats). */
export const weekScheduleInput = z
  .array(dayScheduleInput)
  .length(7, "الأسبوع يجب أن يحتوي على 7 أيام")
  .refine((week) => new Set(week.map((d) => d.weekday)).size === 7, "يوم مكرر في الأسبوع");

export type WeekScheduleInput = z.infer<typeof weekScheduleInput>;

/** Intervals per day on the form (the editor allows 3). */
const MAX_FORM_INTERVALS = 10;

export type WeekParseResult =
  | { ok: true; data: WeekScheduleInput; week: DayScheduleInput[] }
  | { ok: false; errors: Record<string, string>; week: DayScheduleInput[] };

/**
 * Reads the hours editor of the clinic form. Field names: `d{weekday}_closed`,
 * `d{weekday}_from_{i}`, `d{weekday}_to_{i}`. Errors are keyed `d{weekday}` (the whole day)
 * or `d{weekday}_{i}` (one interval). `week` is what the user typed, for showing the form again.
 */
export function parseWeekForm(fd: FormData): WeekParseResult {
  const str = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v.trim() : null;
  };
  const week: DayScheduleInput[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    const closed = fd.has(`d${weekday}_closed`);
    const intervals: { from: string; to: string }[] = [];
    if (!closed) {
      for (let i = 0; i < MAX_FORM_INTERVALS; i++) {
        const from = str(`d${weekday}_from_${i}`);
        const to = str(`d${weekday}_to_${i}`);
        if (from === null && to === null) continue;
        if (!from && !to) continue; // an empty row is ignored
        intervals.push({ from: from ?? "", to: to ?? "" });
      }
    }
    week.push({ weekday, closed, intervals });
  }

  const result = weekScheduleInput.safeParse(week);
  if (result.success) return { ok: true, data: result.data, week };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const [day, field, index] = issue.path;
    if (typeof day !== "number") {
      errors.week ??= issue.message;
      continue;
    }
    const key = field === "intervals" && typeof index === "number" ? `d${day}_${index}` : `d${day}`;
    errors[key] ??= issue.message;
  }
  return { ok: false, errors, week };
}
