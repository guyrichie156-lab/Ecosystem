import { sql } from "drizzle-orm";
import { db } from "@ecosystem/db";
import { bucketByMonth, monthStarts, type CategorySpend, type MonthSpend } from "./chartData";

const nextMonthStart = (now: Date) => new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

/**
 * This month's expenses on active accounts per category, largest first. Same rows as
 * getThisMonthSpend, so the slices add up to "Траты за месяц".
 */
export async function getMonthSpendByCategory(now = new Date()): Promise<CategorySpend[]> {
  const [start] = monthStarts(1, now);
  const rows = await db.all<{ categoryId: number | null; name: string | null; amount: number }>(sql`
    SELECT t.category_id AS categoryId, c.name AS name, SUM(t.amount) AS amount
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE t.type = 'expense'
      AND t.occurred_at >= ${start}
      AND t.occurred_at < ${nextMonthStart(now)}
      AND t.account_id IN (SELECT id FROM accounts WHERE archived_at IS NULL)
    GROUP BY t.category_id
    ORDER BY amount DESC
  `);
  return rows.map((r) => ({ categoryId: r.categoryId, name: r.name ?? "Без категории", amount: r.amount }));
}

/**
 * Expenses on active accounts for each of the last `months` calendar months, oldest first.
 * Months are split in JS by the same local-time month starts the donut uses, so the two agree.
 */
export async function getMonthlySpend(months = 6, now = new Date()): Promise<MonthSpend[]> {
  const starts = monthStarts(months, now);
  const end = nextMonthStart(now);
  const rows = await db.all<{ occurredAt: number; amount: number }>(sql`
    SELECT occurred_at AS occurredAt, amount
    FROM transactions
    WHERE type = 'expense'
      AND occurred_at >= ${starts[0]}
      AND occurred_at < ${end}
      AND account_id IN (SELECT id FROM accounts WHERE archived_at IS NULL)
  `);
  return bucketByMonth(rows, starts, end);
}
