import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { describeError } from "@ecosystem/core";
import { getActiveAccounts, getAccountBalance, getBudgetStatuses } from "./balance";
import { formatMinorUnits } from "./money";
import { updateBalanceWidget } from "../widget/updateWidget";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function notifyNow(title: string, body: string) {
  // expo-notifications can't schedule on web (it throws UnavailabilityError).
  if (Platform.OS === "web") return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

export type TransactionScope = {
  /** Category of the saved expense; only its budget is checked. Null for income and transfers. */
  categoryId: number | null;
  /** Accounts whose balance the transaction changed. */
  accountIds: number[];
};

/**
 * Call right after a transaction is saved: checks the budget and balances it touched and fires local
 * notifications for anything at or over its limit. Other budgets are left alone, so an overspent
 * budget doesn't re-notify on every unrelated transaction.
 */
export async function runPostTransactionChecks(scope: TransactionScope): Promise<void> {
  const statuses = scope.categoryId === null ? [] : (await getBudgetStatuses()).filter((b) => b.categoryId === scope.categoryId);
  for (const b of statuses) {
    if (b.amountLimit <= 0) continue;
    const pct = b.spent / b.amountLimit;
    if (pct >= 1) {
      await notifyNow(
        "Бюджет превышен",
        `«${b.categoryName}»: потрачено ${formatMinorUnits(b.spent)} из ${formatMinorUnits(b.amountLimit)}`
      );
    } else if (pct >= 0.9) {
      await notifyNow(
        "Бюджет почти исчерпан",
        `«${b.categoryName}»: использовано ${Math.round(pct * 100)}% месячного лимита`
      );
    }
  }

  const accounts = (await getActiveAccounts()).filter((a) => scope.accountIds.includes(a.id));
  for (const account of accounts) {
    if (account.lowBalanceThreshold == null) continue;
    const balance = await getAccountBalance(account.id);
    if (balance < account.lowBalanceThreshold) {
      await notifyNow(
        "Низкий баланс",
        `«${account.name}»: ${formatMinorUnits(balance, account.currency)}`
      );
    }
  }
}

/**
 * Widget refresh and alerts after a transaction is added, changed or deleted. These are extras:
 * a failure here is logged and never stops the save itself.
 */
export async function runAfterTransactionChange(scope: TransactionScope): Promise<void> {
  const results = await Promise.allSettled([updateBalanceWidget(), runPostTransactionChecks(scope)]);
  for (const result of results) {
    if (result.status === "rejected") console.warn("Step after saving a transaction failed:", describeError(result.reason));
  }
}
