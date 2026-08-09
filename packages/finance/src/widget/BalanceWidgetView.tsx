import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export interface BalanceWidgetViewProps {
  totalBalance: string;
  monthSpend: string;
}

export function BalanceWidgetView({ totalBalance, monthSpend }: BalanceWidgetViewProps) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: "#1c1c1e",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <TextWidget text="Баланс" style={{ fontSize: 13, color: "#9a9a9e" }} />
      <TextWidget
        text={totalBalance}
        style={{ fontSize: 22, fontWeight: "700", color: "#ffffff" }}
      />
      <TextWidget
        text={`Траты за месяц: ${monthSpend}`}
        style={{ fontSize: 12, color: "#9a9a9e", marginTop: 6 }}
      />
    </FlexWidget>
  );
}
