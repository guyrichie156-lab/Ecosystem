import { test } from "node:test";
import assert from "node:assert/strict";
import { checkAccountForm, checkBudgetForm, checkTransactionForm } from "./validation";

const expense = (amountText: string, accountId: number | null = 1) =>
  checkTransactionForm({ type: "expense", amountText, accountId, counterpartAccountId: null });

test("a record needs an amount above zero with at most two decimals", () => {
  assert.deepEqual(expense("12,50"), { ok: true, value: { amount: 1250, accountId: 1, counterpartAccountId: null } });
  for (const text of ["", "0", "0,00", "12,345", "abc", "-5"]) assert.equal(expense(text).ok, false, `«${text}»`);
});

test("a record needs an account", () => {
  assert.deepEqual(expense("10", null), { ok: false, error: "Выберите счёт." });
});

test("a transfer needs a different receiving account; other records drop it", () => {
  const transfer = (counterpartAccountId: number | null) =>
    checkTransactionForm({ type: "transfer", amountText: "100", accountId: 1, counterpartAccountId });
  assert.deepEqual(transfer(null), { ok: false, error: "Выберите счёт получателя." });
  assert.deepEqual(transfer(1), { ok: false, error: "Выберите счёт получателя." });
  assert.deepEqual(transfer(2), { ok: true, value: { amount: 10000, accountId: 1, counterpartAccountId: 2 } });
  const income = checkTransactionForm({ type: "income", amountText: "100", accountId: 1, counterpartAccountId: 2 });
  assert.deepEqual(income, { ok: true, value: { amount: 10000, accountId: 1, counterpartAccountId: null } });
});

test("an account needs a name; its starting balance may be empty or negative", () => {
  assert.deepEqual(checkAccountForm({ name: "  Карта ", initialBalanceText: "" }), { ok: true, value: { name: "Карта", initialBalance: 0 } });
  assert.deepEqual(checkAccountForm({ name: "Кредитка", initialBalanceText: "-500,50" }), {
    ok: true,
    value: { name: "Кредитка", initialBalance: -50050 },
  });
  assert.deepEqual(checkAccountForm({ name: " ", initialBalanceText: "1" }), { ok: false, error: "Введите название счёта." });
  assert.equal(checkAccountForm({ name: "Карта", initialBalanceText: "много" }).ok, false);
});

test("a budget needs a category without a budget and a limit above zero", () => {
  const budget = (categoryId: number | null, limitText: string) => checkBudgetForm({ categoryId, limitText, budgetedCategoryIds: [3] });
  assert.deepEqual(budget(2, "15 000"), { ok: true, value: { categoryId: 2, amountLimit: 1500000 } });
  assert.deepEqual(budget(null, "100"), { ok: false, error: "Выберите категорию." });
  assert.deepEqual(budget(3, "100"), { ok: false, error: "Для этой категории бюджет уже есть." });
  assert.equal(budget(2, "0").ok, false);
});
