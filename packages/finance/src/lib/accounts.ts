import { db, accounts } from "@ecosystem/db";
import { getAccountBalance } from "./balance";
import { APP_CURRENCY } from "./money";

export type AccountType = "cash" | "bank" | "card" | "savings";

/** Every account with its current balance, archived ones too: the accounts screen manages them all. */
export async function getAccountsWithBalances() {
  const rows = await db.select().from(accounts);
  return Promise.all(rows.map(async (a) => ({ ...a, balance: await getAccountBalance(a.id) })));
}

export async function createAccount(input: { name: string; type: AccountType; initialBalance: number }): Promise<void> {
  await db.insert(accounts).values({ ...input, currency: APP_CURRENCY });
}
