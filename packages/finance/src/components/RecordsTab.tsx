import React, { useCallback, useMemo } from "react";
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAsyncData, useRefreshOnFocus, useThemedStyles, type Theme } from "@ecosystem/core";
import { formatMinorUnits } from "../lib/money";
import { addMonths, monthBounds, type Month } from "../lib/period";
import { groupByDay, summarize } from "../lib/records";
import { getTransactionsBetween, type TransactionListItem } from "../lib/transactions";
import { CategoryIcon } from "./CategoryIcon";
import { FAB_CLEARANCE } from "./layout";
import { MonthSwitcher, formatMonth } from "./MonthSwitcher";

const dayFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });
const weekdayFormat = new Intl.DateTimeFormat("ru-RU", { weekday: "long" });

function titleFor(item: TransactionListItem) {
  if (item.type === "transfer") return `Перевод → ${item.counterpartAccountName ?? "?"}`;
  return item.note || item.categoryName || (item.type === "income" ? "Доход" : "Расход");
}

function subtitleFor(item: TransactionListItem) {
  // The category moves to the subtitle when the note took the title.
  const category = item.type !== "transfer" && item.note ? item.categoryName : null;
  return category ? `${category} · ${item.accountName}` : item.accountName;
}

const Row = React.memo(function Row({ item, onPress }: { item: TransactionListItem; onPress: (id: number) => void }) {
  const styles = useThemedStyles(makeStyles);
  const amount = formatMinorUnits(item.amount, item.currency);
  return (
    <Pressable style={styles.row} onPress={() => onPress(item.id)} accessibilityRole="button">
      <CategoryIcon icon={item.categoryIcon} transfer={item.type === "transfer"} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {titleFor(item)}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {subtitleFor(item)}
        </Text>
      </View>
      <Text style={[styles.amount, item.type === "income" && styles.income, item.type === "transfer" && styles.transfer]}>
        {item.type === "income" ? `+${amount}` : item.type === "expense" ? `−${amount}` : amount}
      </Text>
    </Pressable>
  );
});

/** «Записи»: the month's income and expenses with its totals, one section per day, newest first. */
export function RecordsTab({ month, onMonthChange }: { month: Month; onMonthChange: (month: Month) => void }) {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { data, loading, refreshing, refresh, pullToRefresh } = useAsyncData(() => {
    const { start, end } = monthBounds(month);
    return getTransactionsBetween(start, end);
  }, [month.year, month.month]);
  useRefreshOnFocus(refresh);

  const items = data ?? [];
  const totals = useMemo(() => summarize(items), [items]);
  const sections = useMemo(() => groupByDay(items), [items]);
  const open = useCallback((id: number) => router.push(`/finance/transaction/${id}`), [router]);
  const previous = addMonths(month, -1);

  return (
    <SectionList
      style={styles.list}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={pullToRefresh} />}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View>
          <MonthSwitcher month={month} onChange={onMonthChange} />
          <View style={styles.totals}>
            {[
              ["Расходы", totals.expense],
              ["Доходы", totals.income],
              ["Баланс", totals.balance],
            ].map(([label, value]) => (
              <View key={label} style={styles.total}>
                <Text style={styles.totalLabel}>{label}</Text>
                <Text style={styles.totalValue} numberOfLines={1} adjustsFontSizeToFit>
                  {formatMinorUnits(value as number)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      }
      renderSectionHeader={({ section }) => {
        const date = new Date(section.day);
        const sums = [
          section.expense > 0 ? `Расходы: ${formatMinorUnits(section.expense)}` : null,
          section.income > 0 ? `Доходы: ${formatMinorUnits(section.income)}` : null,
        ].filter(Boolean);
        return (
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>
              {dayFormat.format(date)}, {weekdayFormat.format(date)}
            </Text>
            <Text style={styles.daySums}>{sums.join(" · ")}</Text>
          </View>
        );
      }}
      renderItem={({ item }) => <Row item={item} onPress={open} />}
      ListEmptyComponent={
        loading ? null : <Text style={styles.empty}>В этом месяце записей нет. Добавьте первую кнопкой «+».</Text>
      }
      ListFooterComponent={
        <Pressable style={styles.previous} onPress={() => onMonthChange(previous)} accessibilityRole="button">
          <Text style={styles.previousText}>‹ {formatMonth(previous)}</Text>
        </Pressable>
      }
    />
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    list: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: FAB_CLEARANCE },
    totals: { flexDirection: "row", backgroundColor: t.card, borderRadius: 14, paddingVertical: 12, marginTop: 4 },
    total: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
    totalLabel: { fontSize: 13, color: t.textMuted },
    totalValue: { fontSize: 16, fontWeight: "700", color: t.text, marginTop: 4 },
    dayHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginTop: 20,
      paddingBottom: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.separator,
    },
    dayTitle: { fontSize: 14, fontWeight: "600", color: t.textSecondary },
    daySums: { fontSize: 13, color: t.textMuted, flexShrink: 1, textAlign: "right", marginLeft: 8 },
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
    rowText: { flex: 1 },
    rowTitle: { fontSize: 16, color: t.text },
    rowSubtitle: { fontSize: 13, color: t.textMuted, marginTop: 2 },
    amount: { fontSize: 16, fontWeight: "600", color: t.text },
    income: { color: t.income },
    transfer: { color: t.textMuted },
    empty: { fontSize: 15, color: t.textMuted, marginTop: 28, textAlign: "center" },
    previous: {
      alignSelf: "center",
      marginTop: 24,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: t.border,
    },
    previousText: { fontSize: 15, color: t.text },
  });
