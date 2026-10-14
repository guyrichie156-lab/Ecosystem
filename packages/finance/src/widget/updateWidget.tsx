import React from "react";
import { Platform } from "react-native";
import { requestWidgetUpdate } from "react-native-android-widget";
import { BalanceWidgetView } from "./BalanceWidgetView";
import { getBalanceWidgetProps } from "./widget-content";

/** Call right after any change that could affect the balance (new transaction, edited account, ...). */
export async function updateBalanceWidget(): Promise<void> {
  if (Platform.OS !== "android") return;
  const widgetProps = await getBalanceWidgetProps();
  await requestWidgetUpdate({
    widgetName: "BalanceWidget",
    renderWidget: () => <BalanceWidgetView {...widgetProps} />,
  });
}
