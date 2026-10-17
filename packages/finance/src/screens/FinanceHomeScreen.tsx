import React from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { getAccountBalance, getActiveAccounts, getThisMonthSpend, getTotalBalance } from "../lib/balance";
import { foldCategories } from "../lib/chartData";
import { formatMinorUnits } from "../lib/money";
import { getMonthlySpend, getMonthSpendByCategory } from "../lib/stats";
import { ExpenseDonut } from "../components/ExpenseDonut";
import { MonthlyBars } from "../components/MonthlyBars";
import { useAsyncData } from "../hooks/useAsyncData";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";

const monthName = new Intl.DateTimeFormat("ru-RU", { month: "long" });

export function FinanceHomeScreen() {
  const { data, loading, refresh } = useAsyncData(async () => {
    const [total, spend, accounts, byCategory, monthly] = await Promise.all([
      getTotalBalance(),
      getThisMonthSpend(),
      getActiveAccounts(),
      getMonthSpendByCategory(),
      getMonthlySpend(6),
    ]);
    const accountsWithBalance = await Promise.all(
      accounts.map(async (a) => ({ ...a, balance: await getAccountBalance(a.id) }))
    );
    return { total, spend, accounts: accountsWithBalance, segments: foldCategories(byCategory), monthly };
  }, []);
  useRefreshOnFocus(refresh);

  const header = (
    <View>
      <View style={styles.hero}>
        <Text style={styles.label}>Баланс</Text>
        <Text style={styles.balance}>{data ? formatMinorUnits(data.total) : "…"}</Text>
        <Text style={styles.subLabel}>
          Траты за месяц: {data ? formatMinorUnits(data.spend) : "…"}
        </Text>
      </View>

      <View style={styles.actions}>
        <Link href="/finance/add-transaction" asChild>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonText}>+ Транзакция</Text>
          </Pressable>
        </Link>
        <Link href="/finance/accounts" asChild>
          <Pressable style={styles.actionButtonSecondary}>
            <Text style={styles.actionButtonSecondaryText}>Счета</Text>
          </Pressable>
        </Link>
        <Link href="/finance/budgets" asChild>
          <Pressable style={styles.actionButtonSecondary}>
            <Text style={styles.actionButtonSecondaryText}>Бюджеты</Text>
          </Pressable>
        </Link>
        <Link href="/finance/history" asChild>
          <Pressable style={styles.actionButtonSecondary}>
            <Text style={styles.actionButtonSecondaryText}>История</Text>
          </Pressable>
        </Link>
      </View>

      <Text style={styles.sectionTitle}>Счета</Text>
    </View>
  );

  const charts = data && (
    <View>
      <Text style={[styles.sectionTitle, styles.chartTitle]}>Расходы за {monthName.format(new Date())}</Text>
      {data.segments.length > 0 ? (
        <ExpenseDonut segments={data.segments} monthName={monthName.format(new Date())} />
      ) : (
        <Text style={styles.empty}>В этом месяце расходов пока нет.</Text>
      )}
      <Text style={[styles.sectionTitle, styles.chartTitle]}>Расходы по месяцам</Text>
      {data.monthly.some((m) => m.amount > 0) ? (
        <MonthlyBars months={data.monthly} />
      ) : (
        <Text style={styles.empty}>Расходов за полгода пока нет.</Text>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={data?.accounts ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <View style={styles.accountRow}>
          <Text style={styles.accountName}>{item.name}</Text>
          <Text style={styles.accountBalance}>{formatMinorUnits(item.balance, item.currency)}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Пока нет счетов — добавьте первый на экране «Счета».</Text>}
      ListFooterComponent={charts}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 20, paddingBottom: 40 },
  chartTitle: { marginTop: 28, marginBottom: 12 },
  hero: { marginTop: 16, marginBottom: 20 },
  label: { fontSize: 14, color: "#8a8a8e" },
  balance: { fontSize: 36, fontWeight: "700", color: "#1c1c1e", marginTop: 4 },
  subLabel: { fontSize: 14, color: "#8a8a8e", marginTop: 4 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  actionButton: {
    backgroundColor: "#1c1c1e",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionButtonText: { color: "#ffffff", fontWeight: "600" },
  actionButtonSecondary: {
    backgroundColor: "#f0f0f2",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionButtonSecondaryText: { color: "#1c1c1e", fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1c1c1e", marginBottom: 8 },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5ea",
  },
  accountName: { fontSize: 15, color: "#1c1c1e" },
  accountBalance: { fontSize: 15, color: "#1c1c1e", fontWeight: "600" },
  empty: { color: "#8a8a8e", fontSize: 14, paddingVertical: 12 },
});
