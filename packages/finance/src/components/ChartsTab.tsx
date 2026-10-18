import React, { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SegmentedControl, useAsyncData, useRefreshOnFocus, useThemedStyles, type Theme } from "@ecosystem/core";
import { foldCategories } from "../lib/chartData";
import { getMonthByCategory } from "../lib/stats";
import { type Month } from "../lib/period";
import { CategoryDonut } from "./CategoryDonut";
import { MonthSwitcher } from "./MonthSwitcher";

type Kind = "expense" | "income";

const monthName = new Intl.DateTimeFormat("ru-RU", { month: "long" });

/** «Графики»: the month's expenses or income by category. */
export function ChartsTab({ month, onMonthChange }: { month: Month; onMonthChange: (month: Month) => void }) {
  const styles = useThemedStyles(makeStyles);
  const [kind, setKind] = useState<Kind>("expense");
  const { data, loading, refresh } = useAsyncData(
    () => getMonthByCategory(month, kind).then(foldCategories),
    [month.year, month.month, kind]
  );
  useRefreshOnFocus(refresh);

  const name = monthName.format(new Date(month.year, month.month, 1));
  const caption = `${kind === "expense" ? "расходы" : "доходы"} за ${name}`;

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
    >
      <SegmentedControl
        options={[
          { value: "expense", label: "Расходы" },
          { value: "income", label: "Доходы" },
        ]}
        value={kind}
        onChange={setKind}
      />
      <View style={styles.month}>
        <MonthSwitcher month={month} onChange={onMonthChange} />
      </View>
      {data && data.length > 0 ? (
        // A new key per month and type: the selected slice belongs to the chart it was picked in.
        <CategoryDonut key={`${month.year}-${month.month}-${kind}`} segments={data} caption={caption} />
      ) : (
        !loading && (
          <Text style={styles.empty}>{kind === "expense" ? "В этом месяце расходов нет." : "В этом месяце доходов нет."}</Text>
        )
      )}
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    list: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 110 },
    month: { marginTop: 8, marginBottom: 8 },
    empty: { fontSize: 15, color: t.textMuted, marginTop: 28, textAlign: "center" },
  });
