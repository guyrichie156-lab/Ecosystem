/** Calendar helpers in the device's time zone. Pure, so they can be unit-tested. */

/** A calendar month; `month` is 0–11 like Date's. */
export type Month = { year: number; month: number };

export const monthOf = (date: Date): Month => ({ year: date.getFullYear(), month: date.getMonth() });

export const addMonths = (m: Month, n: number): Month => monthOf(new Date(m.year, m.month + n, 1));

/** Negative if `a` is before `b`, 0 if the same month. */
export const compareMonths = (a: Month, b: Month): number => a.year - b.year || a.month - b.month;

/** [start, end) of the month in milliseconds. */
export function monthBounds(m: Month): { start: number; end: number } {
  return { start: new Date(m.year, m.month, 1).getTime(), end: new Date(m.year, m.month + 1, 1).getTime() };
}

export const startOfDay = (time: number): number => {
  const d = new Date(time);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

/** Weeks of the month from Monday to Sunday; days outside the month are null. */
export function calendarWeeks(m: Month): (number | null)[][] {
  const daysInMonth = new Date(m.year, m.month + 1, 0).getDate();
  const firstWeekday = (new Date(m.year, m.month, 1).getDay() + 6) % 7; // Monday = 0
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null)];
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * The moment to store for a transaction dated `day` (any time on that day): now if the day is
 * today, otherwise noon, so the record sorts sensibly within its day.
 */
export function occurredAtFor(day: number, now: number): number {
  if (startOfDay(day) === startOfDay(now)) return now;
  const d = new Date(day);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime();
}
