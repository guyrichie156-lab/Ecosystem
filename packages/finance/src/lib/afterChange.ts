import { describeError } from "@ecosystem/core";
import { runPostTransactionChecks, type TransactionScope } from "./notifications";
import { updateBalanceWidget } from "../widget/updateWidget";

/**
 * Widget refresh and alerts after a record is added, changed or deleted. These are extras: a
 * failure here is logged and never stops the save itself.
 */
export async function runAfterTransactionChange(scope: TransactionScope): Promise<void> {
  const results = await Promise.allSettled([updateBalanceWidget(), runPostTransactionChecks(scope)]);
  for (const result of results) {
    if (result.status === "rejected") console.warn("Step after saving a record failed:", describeError(result.reason));
  }
}

/** A new account changes the total balance on the widget. */
export async function runAfterAccountChange(): Promise<void> {
  try {
    await updateBalanceWidget();
  } catch (e) {
    console.warn("Updating the widget after an account change failed:", describeError(e));
  }
}
