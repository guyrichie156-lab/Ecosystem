import React from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { getAccountBalance, getActiveAccounts, getThisMonthSpend, getTotalBalance } from "../lib/balance";
import { formatMinorUnits } from "../lib/money";
import { useAsyncData } from "../hooks/useAsyncData";

export function FinanceHomeScreen() {
  const { data, loading, refresh } = useAsyncData(async () => {
    const [total, spend, accounts] = await Promise.all([
      getTotalBalance(),
      getThisMonthSpend(),
      getActiveAccounts(),
    ]);
    const accountsWithBalance = await Promise.all(
      accounts.map(async (a) => ({ ...a, balance: await getAccountBalance(a.id) }))
    );
    return { total, spend, accounts: accountsWithBalance };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.label}>Баланс</Text>
        <Text style={styles.balance}>{data ? formatMinorUnits(data.total, "RUB") : "…"}</Text>
        <Text style={styles.subLabel}>
          Траты за месяц: {data ? formatMinorUnits(data.spend, "RUB") : "…"}
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
      </View>

      <Text style={styles.sectionTitle}>Счета</Text>
      <FlatList
        data={data?.accounts ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        renderItem={({ item }) => (
          <View style={styles.accountRow}>
            <Text style={styles.accountName}>{item.name}</Text>
            <Text style={styles.accountBalance}>{formatMinorUnits(item.balance, item.currency)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Пока нет счетов — добавьте первый на экране «Счета».</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", padding: 20 },
  hero: { marginTop: 16, marginBottom: 20 },
  label: { fontSize: 14, color: "#8a8a8e" },
  balance: { fontSize: 36, fontWeight: "700", color: "#1c1c1e", marginTop: 4 },
  subLabel: { fontSize: 14, color: "#8a8a8e", marginTop: 4 },
  actions: { flexDirection: "row", gap: 8, marginBottom: 24 },
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
