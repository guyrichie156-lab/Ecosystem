/** The finance forms' input checks, without the database or the screen, so they can be unit-tested. */
import { parseMinorUnits } from "./money";

/** Either the checked values, ready to save, or the message to show under the form. */
export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

type TransactionKind = "income" | "expense" | "transfer";

/** The record form: an amount above zero, an account, and for a transfer a different receiving account. */
export function checkTransactionForm(form: {
  type: TransactionKind;
  amountText: string;
  accountId: number | null;
  counterpartAccountId: number | null;
}): Checked<{ amount: number; accountId: number; counterpartAccountId: number | null }> {
  const amount = parseMinorUnits(form.amountText);
  if (!amount || amount <= 0) return { ok: false, error: "Введите сумму, например 1500 или 1500,50." };
  if (!form.accountId) return { ok: false, error: "Выберите счёт." };
  if (form.type !== "transfer") return { ok: true, value: { amount, accountId: form.accountId, counterpartAccountId: null } };
  if (!form.counterpartAccountId || form.counterpartAccountId === form.accountId) {
    return { ok: false, error: "Выберите счёт получателя." };
  }
  return { ok: true, value: { amount, accountId: form.accountId, counterpartAccountId: form.counterpartAccountId } };
}

/** The new-account form: a name and a starting balance, which may be negative (a credit card or a debt). */
export function checkAccountForm(form: { name: string; initialBalanceText: string }): Checked<{ name: string; initialBalance: number }> {
  const name = form.name.trim();
  if (!name) return { ok: false, error: "Введите название счёта." };
  const initialBalance = parseMinorUnits(form.initialBalanceText || "0", { allowNegative: true });
  if (initialBalance === null) return { ok: false, error: "Начальный баланс — число, например 1 000 или -500,50." };
  return { ok: true, value: { name, initialBalance } };
}

/** The new-budget form: a category without a budget yet and a limit above zero. */
export function checkBudgetForm(form: {
  categoryId: number | null;
  limitText: string;
  budgetedCategoryIds: number[];
}): Checked<{ categoryId: number; amountLimit: number }> {
  if (!form.categoryId) return { ok: false, error: "Выберите категорию." };
  if (form.budgetedCategoryIds.includes(form.categoryId)) return { ok: false, error: "Для этой категории бюджет уже есть." };
  const amountLimit = parseMinorUnits(form.limitText);
  if (!amountLimit || amountLimit <= 0) return { ok: false, error: "Лимит — число больше нуля, например 15 000." };
  return { ok: true, value: { categoryId: form.categoryId, amountLimit } };
}
