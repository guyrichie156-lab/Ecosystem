import { db, budgets } from "@ecosystem/db";
import { monthKey, monthOf } from "./period";

/** A monthly limit for one expense category, starting this month. */
export async function createBudget(input: { categoryId: number; amountLimit: number }): Promise<void> {
  await db.insert(budgets).values({ ...input, period: "monthly", startMonth: monthKey(monthOf(new Date())) });
}
