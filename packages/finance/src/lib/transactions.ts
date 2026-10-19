import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db, accounts, categories, transactions } from "@ecosystem/db";
import { activeAccountIds } from "./activeAccounts";
import { getActiveAccounts } from "./balance";

export type TransactionType = "income" | "expense" | "transfer";

export type TransactionInput = {
  accountId: number;
  type: TransactionType;
  amount: number;
  currency: string;
  categoryId: number | null;
  counterpartAccountId: number | null;
  note: string | null;
  /** When it happened; a new transaction without one is dated now. */
  occurredAt?: number;
};

const counterpart = alias(accounts, "counterpart");

/** Transactions in [start, end), newest first, with the names and icons needed to show them in a list. */
export async function getTransactionsBetween(start: number, end: number) {
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
      categoryIcon: categories.icon,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .leftJoin(counterpart, eq(counterpart.id, transactions.counterpartAccountId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(and(gte(transactions.occurredAt, start), lt(transactions.occurredAt, end), sql`${transactions.accountId} IN ${activeAccountIds}`))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id));
}

export type TransactionListItem = Awaited<ReturnType<typeof getTransactionsBetween>>[number];

/** What the record form needs: the accounts to choose from, all categories and, when editing, the record. */
export async function getTransactionFormData(transactionId?: number) {
  const [accountRows, categoryRows, existing] = await Promise.all([
    getActiveAccounts(),
    db.select().from(categories),
    transactionId === undefined ? Promise.resolve(undefined) : getTransaction(transactionId),
  ]);
  return { accounts: accountRows, categories: categoryRows, existing };
}

export async function getTransaction(id: number) {
  const rows = await db.select().from(transactions).where(eq(transactions.id, id));
  return rows[0];
}

export async function addTransaction(input: TransactionInput): Promise<void> {
  await db.insert(transactions).values({ ...input, occurredAt: input.occurredAt ?? Date.now() });
}

/** Changes a transaction; its date changes only if `occurredAt` is given. */
export async function updateTransaction(id: number, input: TransactionInput): Promise<void> {
  await db.update(transactions).set(input).where(eq(transactions.id, id));
}

export async function deleteTransaction(id: number): Promise<void> {
  await db.delete(transactions).where(eq(transactions.id, id));
}
