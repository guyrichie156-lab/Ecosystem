/** Month summaries, day groups and the monthly report table. Pure, so they can be unit-tested. */
import { startOfDay } from "./period";

type Row = { type: "income" | "expense" | "transfer"; amount: number; occurredAt: number };

export type Totals = { income: number; expense: number; balance: number };

/** Income, expenses and their difference; transfers move money between own accounts and count as neither. */
export function summarize(rows: Row[]): Totals {
  let income = 0;
  let expense = 0;
  for (const r of rows) {
    if (r.type === "income") income += r.amount;
    else if (r.type === "expense") expense += r.amount;
  }
  return { income, expense, balance: income - expense };
}

export type DaySection<T> = { day: number; income: number; expense: number; data: T[] };

/** One section per calendar day, in the order of `rows` (newest first), with the day's totals. */
export function groupByDay<T extends Row>(rows: T[]): DaySection<T>[] {
  const sections: DaySection<T>[] = [];
  for (const row of rows) {
    const day = startOfDay(row.occurredAt);
    let section = sections[sections.length - 1];
    if (!section || section.day !== day) {
      section = { day, income: 0, expense: 0, data: [] };
      sections.push(section);
    }
    section.data.push(row);
    if (row.type === "income") section.income += row.amount;
    else if (row.type === "expense") section.expense += row.amount;
  }
  return sections;
}

export type MonthTotals = Totals & { year: number; month: number };

/** The report table: every month that has income or expenses, newest first, grouped by year. */
export function monthlyReport(rows: Row[]): { year: number; months: MonthTotals[] }[] {
  const byMonth = new Map<string, MonthTotals>();
  for (const r of rows) {
    if (r.type === "transfer") continue;
    const d = new Date(r.occurredAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let m = byMonth.get(key);
    if (!m) {
      m = { year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0, balance: 0 };
      byMonth.set(key, m);
    }
    if (r.type === "income") m.income += r.amount;
    else m.expense += r.amount;
    m.balance = m.income - m.expense;
  }
  const months = [...byMonth.values()].sort((a, b) => b.year - a.year || b.month - a.month);
  const years: { year: number; months: MonthTotals[] }[] = [];
  for (const m of months) {
    const last = years[years.length - 1];
    if (last && last.year === m.year) last.months.push(m);
    else years.push({ year: m.year, months: [m] });
  }
  return years;
}
