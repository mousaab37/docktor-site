import type { Weekday, WorkingHour } from "./types";
import type { DayScheduleInput } from "./validation/working-hours";

// 0 = Sunday ... 6 = Saturday (same as JS getDay()).
export const weekdayNames: Record<Weekday, string> = {
  0: "الأحد",
  1: "الاثنين",
  2: "الثلاثاء",
  3: "الأربعاء",
  4: "الخميس",
  5: "الجمعة",
  6: "السبت",
};

/** The week starts on Saturday. */
export const displayOrder: Weekday[] = [6, 0, 1, 2, 3, 4, 5];

export interface DayHours {
  weekday: Weekday;
  closed: boolean;
  intervals: { from: string; to: string }[];
}

/**
 * One row per day, in displayOrder. A day with no rows, or only closed rows,
 * counts as closed. Intervals are sorted by interval_order.
 */
export function groupHours(hours: WorkingHour[]): DayHours[] {
  return displayOrder.map((weekday) => {
    const intervals = hours
      .filter((h) => h.weekday === weekday && !h.is_closed && h.opening_time && h.closing_time)
      .sort((a, b) => a.interval_order - b.interval_order)
      .map((h) => ({ from: h.opening_time as string, to: h.closing_time as string }));
    return { weekday, closed: intervals.length === 0, intervals };
  });
}

/** "16:30" -> "4:30 م", "09:00" -> "9:00 ص", "12:00" -> "12:00 م", "00:15" -> "12:15 ص". */
export function formatTime(hhmm: string): string {
  const [hStr, mStr = "00"] = hhmm.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "م" : "ص";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr.padStart(2, "0")} ${suffix}`;
}

/** The stored hours of a clinic as an editable week (in displayOrder). A day with no rows is closed. */
export function weekFromHours(hours: WorkingHour[]): DayScheduleInput[] {
  return groupHours(hours).map((d) => ({
    weekday: d.weekday,
    closed: d.closed,
    intervals: d.intervals.map((iv) => ({ from: iv.from.slice(0, 5), to: iv.to.slice(0, 5) })),
  }));
}

/** A new clinic starts with Saturday to Thursday 09:00-17:00 and Friday closed. */
export function defaultWeek(): DayScheduleInput[] {
  return displayOrder.map((weekday) =>
    weekday === 5
      ? { weekday, closed: true, intervals: [] }
      : { weekday, closed: false, intervals: [{ from: "09:00", to: "17:00" }] },
  );
}

/**
 * One line for the clinics list: consecutive open days are grouped ("السبت–الخميس"), closed days follow
 * ("الجمعة مغلق"). Different times on different days are not shown.
 */
export function hoursSummary(hours: WorkingHour[]): string {
  if (hours.length === 0) return "لم تُحدَّد الساعات";
  const days = groupHours(hours);
  const open = days.filter((d) => !d.closed);
  if (open.length === 0) return "مغلقة طوال الأسبوع";
  if (open.length === 7) return "كل أيام الأسبوع";

  // Runs of consecutive open days, in displayOrder (the week starts on Saturday).
  const runs: DayHours[][] = [];
  for (const d of days) {
    if (d.closed) continue;
    const last = runs[runs.length - 1];
    const prev = last?.[last.length - 1];
    if (prev && days.indexOf(prev) === days.indexOf(d) - 1) last.push(d);
    else runs.push([d]);
  }
  const label = (run: DayHours[]) =>
    run.length === 1 ? weekdayNames[run[0].weekday] : `${weekdayNames[run[0].weekday]}–${weekdayNames[run[run.length - 1].weekday]}`;
  const closed = days.filter((d) => d.closed).map((d) => weekdayNames[d.weekday]);
  // "السبت والجمعة مغلق": the و is attached to the following name.
  const closedText = closed.map((n, i) => (i === 0 ? n : `و${n}`)).join(" ");
  return `${runs.map(label).join("، ")}، ${closedText} مغلق`;
}
