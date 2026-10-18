import React, { useMemo } from "react";
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";
import { useThemedStyles, type Theme } from "@ecosystem/core";
import { useRouter } from "expo-router";
import { useAsyncData } from "../hooks/useAsyncData";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import { formatMinorUnits } from "../lib/money";
import { getTransactionHistory, type TransactionHistoryItem } from "../lib/transactions";

const dayFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

/** Groups transactions (already sorted newest first) into one section per calendar day. */
function groupByDay(items: TransactionHistoryItem[]) {
  const sections: { title: string; data: TransactionHistoryItem[] }[] = [];
  for (const item of items) {
    const title = dayFormat.format(new Date(item.occurredAt));
    const last = sections[sections.length - 1];
    if (last && last.title === title) {
      last.data.push(item);
    } else {
      sections.push({ title, data: [item] });
    }
  }
  return sections;
}

function titleFor(item: TransactionHistoryItem) {
  if (item.type === "transfer") return `Перевод → ${item.counterpartAccountName ?? "?"}`;
  return item.categoryName ?? (item.type === "income" ? "Доход" : "Расход");
}

function amountFor(item: TransactionHistoryItem) {
  const formatted = formatMinorUnits(item.amount, item.currency);
  if (item.type === "income") return `+${formatted}`;
  if (item.type === "expense") return `−${formatted}`;
  return formatted;
}

const TransactionRow = React.memo(function TransactionRow({
  item,
  onPress,
}: {
  item: TransactionHistoryItem;
  onPress: (id: number) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const subtitle = item.note ? `${item.accountName} · ${item.note}` : item.accountName;
  return (
    <Pressable style={styles.row} onPress={() => onPress(item.id)}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {titleFor(item)}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text style={[styles.amount, item.type === "income" && styles.income, item.type === "expense" && styles.expense]}>
        {amountFor(item)}
      </Text>
    </Pressable>
  );
});

export function TransactionHistoryScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { data, loading, refresh } = useAsyncData(getTransactionHistory, []);
  useRefreshOnFocus(refresh);

  const sections = useMemo(() => groupByDay(data ?? []), [data]);
  const openTransaction = React.useCallback(
    (id: number) => router.push(`/finance/transaction/${id}`),
    [router]
  );

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <TransactionRow item={item} onPress={openTransaction} />}
      renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      ListEmptyComponent={
        loading ? null : <Text style={styles.empty}>Транзакций пока нет.</Text>
      }
    />
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    sectionHeader: { fontSize: 13, fontWeight: "600", color: t.textMuted, marginTop: 20, marginBottom: 4 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.separator,
    },
    rowText: { flex: 1, marginRight: 12 },
    rowTitle: { fontSize: 15, color: t.text },
    rowSubtitle: { fontSize: 13, color: t.textMuted, marginTop: 2 },
    amount: { fontSize: 15, fontWeight: "600", color: t.text },
    income: { color: t.income },
    expense: { color: t.danger },
    empty: { color: t.textMuted, fontSize: 14, paddingVertical: 20 },
  });
