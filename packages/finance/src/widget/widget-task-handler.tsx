import React from "react";
import { Platform } from "react-native";
import { registerWidgetTaskHandler, type WidgetTaskHandlerProps } from "react-native-android-widget";
import { BalanceWidgetView } from "./BalanceWidgetView";
import { getBalanceWidgetProps } from "./widget-content";

async function handleWidgetEvent(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== "BalanceWidget") return;
  if (props.widgetAction === "WIDGET_DELETED") return;

  const widgetProps = await getBalanceWidgetProps();
  props.renderWidget(<BalanceWidgetView {...widgetProps} />);
}

/** Call once, at app startup (including headless widget-update starts), to register the widget's background renderer. */
export function registerFinanceWidgetTaskHandler() {
  if (Platform.OS !== "android") return;
  registerWidgetTaskHandler(handleWidgetEvent);
}
