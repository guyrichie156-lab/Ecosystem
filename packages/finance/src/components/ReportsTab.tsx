import React from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { useAsyncData, useRefreshOnFocus, useThemedStyles, type Theme } from "@ecosystem/core";
import { getAccountBalance, getActiveAccounts, getTotalBalance } from "../lib/balance";
import { formatAmount, formatMinorUnits } from "../lib/money";
import { monthlyReport, summarize } from "../lib/records";
import { getMonthlySpend, getReportRows } from "../lib/stats";
import { MonthlyBars } from "./MonthlyBars";

const monthShort = new Intl.DateTimeFormat("ru-RU", { month: "short" });

/** «Отчёты»: the overall balance, accounts, expenses by month and the month-by-month table. */
export function ReportsTab() {
  const styles = useThemedStyles(makeStyles);
  const { data, loading, refreshing, refresh, pullToRefresh } = useAsyncData(async () => {
    const [balance, accounts, rows, monthly] = await Promise.all([
      getTotalBalance(),
      getActiveAccounts(),
      getReportRows(),
      getMonthlySpend(6),
    ]);
    const withBalances = await Promise.all(accounts.map(async (a) => ({ ...a, balance: await getAccountBalance(a.id) })));
    return { balance, accounts: withBalances, totals: summarize(rows), report: monthlyReport(rows), monthly };
  }, []);
  useRefreshOnFocus(refresh);

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={pullToRefresh} />}
    >
      <Text style={styles.heroLabel}>Общий баланс</Text>
      <Text style={styles.hero} numberOfLines={1} adjustsFontSizeToFit>
        {data ? formatMinorUnits(data.balance) : "…"}
      </Text>
      <View style={styles.totals}>
        <View style={styles.total}>
          <Text style={styles.totalLabel}>Расходы</Text>
          <Text style={styles.totalValue}>{data ? formatMinorUnits(data.totals.expense) : "…"}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.total}>
          <Text style={styles.totalLabel}>Доходы</Text>
          <Text style={styles.totalValue}>{data ? formatMinorUnits(data.totals.income) : "…"}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Счета</Text>
        <Link href="/finance/accounts" asChild>
          <Pressable hitSlop={8} accessibilityRole="link">
            <Text style={styles.link}>Изменить</Text>
          </Pressable>
        </Link>
      </View>
      {(data?.accounts ?? []).map((a) => (
        <View key={a.id} style={styles.accountRow}>
          <Text style={styles.accountName}>{a.name}</Text>
          <Text style={styles.accountBalance}>{formatMinorUnits(a.balance, a.currency)}</Text>
        </View>
      ))}
      {data && data.accounts.length === 0 && <Text style={styles.empty}>Счетов пока нет — добавьте первый.</Text>}

      <Text style={[styles.sectionTitle, styles.spaced]}>Расходы по месяцам</Text>
      {data && data.monthly.some((m) => m.amount > 0) ? (
        <MonthlyBars months={data.monthly} />
      ) : (
        <Text style={styles.empty}>Расходов за полгода нет.</Text>
      )}

      {data && data.report.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, styles.spaced]}>По месяцам, BYN</Text>
          <View style={[styles.tableRow, styles.tableHead]}>
            <Text style={[styles.cellMonth, styles.headText]}>Месяц</Text>
            <Text style={[styles.cell, styles.headText]}>Расходы</Text>
            <Text style={[styles.cell, styles.headText]}>Доходы</Text>
            <Text style={[styles.cell, styles.headText]}>Баланс</Text>
          </View>
          {data.report.map((year) => (
            <View key={year.year}>
              <Text style={styles.year}>{year.year}</Text>
              {year.months.map((m) => (
                <View key={`${m.year}-${m.month}`} style={styles.tableRow}>
                  <Text style={styles.cellMonth}>{monthShort.format(new Date(m.year, m.month, 1))}</Text>
                  <Text style={styles.cell}>{formatAmount(m.expense)}</Text>
                  <Text style={styles.cell}>{formatAmount(m.income)}</Text>
                  <Text style={[styles.cell, m.balance < 0 && styles.negative]}>{formatAmount(m.balance)}</Text>
                </View>
              ))}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    list: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 110 },
    heroLabel: { fontSize: 15, color: t.textMuted, textAlign: "center", marginTop: 8 },
    hero: { fontSize: 36, fontWeight: "700", color: t.text, textAlign: "center", marginTop: 4 },
    totals: { flexDirection: "row", backgroundColor: t.card, borderRadius: 14, paddingVertical: 12, marginTop: 16 },
    total: { flex: 1, alignItems: "center" },
    divider: { width: StyleSheet.hairlineWidth, backgroundColor: t.separator },
    totalLabel: { fontSize: 13, color: t.textMuted },
    totalValue: { fontSize: 17, fontWeight: "700", color: t.text, marginTop: 4 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 28 },
    sectionTitle: { fontSize: 17, fontWeight: "600", color: t.text },
    spaced: { marginTop: 28, marginBottom: 10 },
    link: { fontSize: 15, color: t.link },
    accountRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.separator,
    },
    accountName: { fontSize: 15, color: t.text },
    accountBalance: { fontSize: 15, fontWeight: "600", color: t.text },
    empty: { fontSize: 15, color: t.textMuted, paddingVertical: 12 },
    tableHead: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.separator },
    headText: { fontSize: 13, color: t.textMuted },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.separator,
    },
    year: { fontSize: 14, color: t.textMuted, marginTop: 14, marginBottom: 2 },
    cellMonth: { width: 64, fontSize: 15, color: t.text },
    // Numbers line up in columns: tabular figures, right-aligned.
    cell: { flex: 1, fontSize: 15, color: t.text, textAlign: "right", fontVariant: ["tabular-nums"] },
    negative: { color: t.danger },
  });
