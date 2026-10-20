import type { Meal } from "./nutrition";
import { MEALS } from "./nutrition";

const DAY = 24 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-10-20" for a local date: what screens pass to each other. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight of a day key; today for anything that isn't one. */
export function dayStart(key: string | undefined): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key ?? "");
  const today = new Date();
  if (!match) return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** The next calendar day (by date, so a daylight-saving change can't skip one). */
export function addDays(start: Date, days: number): Date {
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + days);
}

/** When an entry for that day is saved: now if it is today, else noon of that day (as in «Финансы»). */
export function entryTime(key: string, now: Date): number {
  if (key === dayKey(now)) return now.getTime();
  return dayStart(key).getTime() + DAY / 2;
}

export function isMeal(value: string | undefined): value is Meal {
  return MEALS.some((m) => m.id === value);
}
