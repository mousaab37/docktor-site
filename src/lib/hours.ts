import type { Weekday, WorkingHour } from "./types";

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
