import { sql } from "drizzle-orm";
import { db } from "@ecosystem/db";
import { bucketByMonth, monthStarts, type CategorySpend, type MonthSpend } from "./chartData";
import { monthBounds, monthOf, type Month } from "./period";
import { activeAccountIds } from "./activeAccounts";


/** A month's expenses or income on active accounts per category, largest first. */
export async function getMonthByCategory(month: Month, type: "expense" | "income"): Promise<CategorySpend[]> {
  const { start, end } = monthBounds(month);
  const rows = await db.all<{ categoryId: number | null; name: string | null; icon: string | null; amount: number }>(sql`
    SELECT t.category_id AS categoryId, c.name AS name, c.icon AS icon, SUM(t.amount) AS amount
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE t.type = ${type}
      AND t.occurred_at >= ${start}
      AND t.occurred_at < ${end}
      AND t.account_id IN ${activeAccountIds}
    GROUP BY t.category_id
    ORDER BY amount DESC
  `);
  return rows.map((r) => ({ categoryId: r.categoryId, name: r.name ?? "Без категории", icon: r.icon, amount: r.amount }));
}

/**
 * Expenses on active accounts for each of the last `months` calendar months, oldest first.
 * Months are split in JS by the same local-time month starts the rest of the screen uses.
 */
export async function getMonthlySpend(months = 6, now = new Date()): Promise<MonthSpend[]> {
  const starts = monthStarts(months, now);
  const end = monthBounds(monthOf(now)).end;
  const rows = await db.all<{ occurredAt: number; amount: number }>(sql`
    SELECT occurred_at AS occurredAt, amount
    FROM transactions
    WHERE type = 'expense'
      AND occurred_at >= ${starts[0]}
      AND occurred_at < ${end}
      AND account_id IN ${activeAccountIds}
  `);
  return bucketByMonth(rows, starts, end);
}

/** Every income and expense on active accounts, for the report table (records.monthlyReport). */
export async function getReportRows() {
  return db.all<{ type: "income" | "expense"; amount: number; occurredAt: number }>(sql`
    SELECT type, amount, occurred_at AS occurredAt
    FROM transactions
    WHERE type IN ('income', 'expense')
      AND account_id IN ${activeAccountIds}
  `);
}
