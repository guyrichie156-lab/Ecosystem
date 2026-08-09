import { sql } from "drizzle-orm";
import { db, accounts, categories, budgets } from "@ecosystem/db";

function currentMonthStartMillis(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

export async function getActiveAccounts() {
  return db.select().from(accounts).where(sql`${accounts.archivedAt} IS NULL`);
}

/** Initial balance plus every posted transaction that touches this account, in minor units. */
export async function getAccountBalance(accountId: number): Promise<number> {
  const row = await db.get<{ total: number }>(sql`
    SELECT
      (SELECT initial_balance FROM accounts WHERE id = ${accountId})
      + COALESCE((
          SELECT SUM(
            CASE
              WHEN type = 'income' THEN amount
              WHEN type = 'expense' THEN -amount
              WHEN type = 'transfer' THEN -amount
              ELSE 0
            END
          )
          FROM transactions
          WHERE account_id = ${accountId}
        ), 0)
      + COALESCE((
          SELECT SUM(amount)
          FROM transactions
          WHERE type = 'transfer' AND counterpart_account_id = ${accountId}
        ), 0)
      AS total
  `);
  return row?.total ?? 0;
}

/** Sum of every active account's balance, in minor units. */
export async function getTotalBalance(): Promise<number> {
  const row = await db.get<{ total: number }>(sql`
    SELECT
      COALESCE((SELECT SUM(initial_balance) FROM accounts WHERE archived_at IS NULL), 0)
      + COALESCE((
          SELECT SUM(
            CASE
              WHEN type = 'income' THEN amount
              WHEN type = 'expense' THEN -amount
              WHEN type = 'transfer' THEN -amount
              ELSE 0
            END
          )
          FROM transactions
          WHERE account_id IN (SELECT id FROM accounts WHERE archived_at IS NULL)
        ), 0)
      + COALESCE((
          SELECT SUM(amount)
          FROM transactions
          WHERE type = 'transfer'
            AND counterpart_account_id IN (SELECT id FROM accounts WHERE archived_at IS NULL)
        ), 0)
      AS total
  `);
  return row?.total ?? 0;
}

/** Sum of expense transactions on active accounts since the start of the current month, in minor units. */
export async function getThisMonthSpend(): Promise<number> {
  const row = await db.get<{ total: number }>(sql`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM transactions
    WHERE type = 'expense'
      AND occurred_at >= ${currentMonthStartMillis()}
      AND account_id IN (SELECT id FROM accounts WHERE archived_at IS NULL)
  `);
  return row?.total ?? 0;
}

export type BudgetStatus = {
  id: number;
  categoryId: number;
  categoryName: string;
  amountLimit: number;
  spent: number;
};

/** Every budget with how much of its monthly limit has been spent so far this month. */
export async function getBudgetStatuses(): Promise<BudgetStatus[]> {
  const rows = await db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      amountLimit: budgets.amountLimit,
    })
    .from(budgets)
    .innerJoin(categories, sql`${categories.id} = ${budgets.categoryId}`);

  const monthStart = currentMonthStartMillis();
  const results: BudgetStatus[] = [];
  for (const b of rows) {
    const spentRow = await db.get<{ total: number }>(sql`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM transactions
      WHERE type = 'expense' AND category_id = ${b.categoryId} AND occurred_at >= ${monthStart}
    `);
    results.push({ ...b, spent: spentRow?.total ?? 0 });
  }
  return results;
}
