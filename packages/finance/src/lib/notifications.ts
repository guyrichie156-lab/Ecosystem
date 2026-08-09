import * as Notifications from "expo-notifications";
import { getActiveAccounts, getAccountBalance, getBudgetStatuses } from "./balance";
import { formatMinorUnits } from "./money";

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
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

/** Call right after a transaction is saved: checks budgets and account balances, fires local notifications for anything crossed. */
export async function runPostTransactionChecks(): Promise<void> {
  const statuses = await getBudgetStatuses();
  for (const b of statuses) {
    if (b.amountLimit <= 0) continue;
    const pct = b.spent / b.amountLimit;
    if (pct >= 1) {
      await notifyNow(
        "Бюджет превышен",
        `«${b.categoryName}»: потрачено ${formatMinorUnits(b.spent, "RUB")} из ${formatMinorUnits(b.amountLimit, "RUB")}`
      );
    } else if (pct >= 0.9) {
      await notifyNow(
        "Бюджет почти исчерпан",
        `«${b.categoryName}»: использовано ${Math.round(pct * 100)}% месячного лимита`
      );
    }
  }

  const accounts = await getActiveAccounts();
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
