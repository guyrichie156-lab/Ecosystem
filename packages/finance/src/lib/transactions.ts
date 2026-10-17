import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db, accounts, categories, transactions } from "@ecosystem/db";

export type TransactionType = "income" | "expense" | "transfer";

export type TransactionInput = {
  accountId: number;
  type: TransactionType;
  amount: number;
  currency: string;
  categoryId: number | null;
  counterpartAccountId: number | null;
  note: string | null;
};

const counterpart = alias(accounts, "counterpart");

/** Every transaction, newest first, with the names needed to show it in a list. */
export async function getTransactionHistory() {
  return db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      currency: transactions.currency,
      occurredAt: transactions.occurredAt,
      note: transactions.note,
      accountName: accounts.name,
      counterpartAccountName: counterpart.name,
      categoryName: categories.name,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .leftJoin(counterpart, eq(counterpart.id, transactions.counterpartAccountId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id));
}

export type TransactionHistoryItem = Awaited<ReturnType<typeof getTransactionHistory>>[number];

export async function getTransaction(id: number) {
  const rows = await db.select().from(transactions).where(eq(transactions.id, id));
  return rows[0];
}

export async function addTransaction(input: TransactionInput): Promise<void> {
  await db.insert(transactions).values({ ...input, occurredAt: Date.now() });
}

/** Changes a transaction but keeps its original date. */
export async function updateTransaction(id: number, input: TransactionInput): Promise<void> {
  await db.update(transactions).set(input).where(eq(transactions.id, id));
}

export async function deleteTransaction(id: number): Promise<void> {
  await db.delete(transactions).where(eq(transactions.id, id));
}
