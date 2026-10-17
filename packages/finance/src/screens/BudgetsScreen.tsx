import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { TextField } from "@ecosystem/core";
import { db, budgets as budgetsTable, categories as categoriesTable } from "@ecosystem/db";
import { eq } from "drizzle-orm";
import { useAsyncData } from "../hooks/useAsyncData";
import { getBudgetStatuses } from "../lib/balance";
import { formatMinorUnits, parseMinorUnits } from "../lib/money";
import { Chip } from "../components/Chip";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function BudgetsScreen() {
  const { data, loading, refresh } = useAsyncData(async () => {
    const [statuses, expenseCategories] = await Promise.all([
      getBudgetStatuses(),
      db.select().from(categoriesTable).where(eq(categoriesTable.kind, "expense")),
    ]);
    return { statuses, expenseCategories };
  }, []);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [limitText, setLimitText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!categoryId) {
      setError("Выберите категорию.");
      return;
    }
    if (data?.statuses.some((b) => b.categoryId === categoryId)) {
      setError("Для этой категории бюджет уже есть.");
      return;
    }
    const limit = parseMinorUnits(limitText);
    if (!limit || limit <= 0) {
      setError("Лимит — число больше нуля, например 15 000.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await db.insert(budgetsTable).values({
        categoryId,
        amountLimit: limit,
        period: "monthly",
        startMonth: currentMonth(),
      });
      setCategoryId(null);
      setLimitText("");
      refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.statuses ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        renderItem={({ item }) => {
          const pct = item.amountLimit > 0 ? Math.min(1, item.spent / item.amountLimit) : 0;
          const over = item.spent > item.amountLimit;
          return (
            <View style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowTitle}>{item.categoryName}</Text>
                <Text style={[styles.rowValue, over && styles.rowValueOver]}>
                  {formatMinorUnits(item.spent, "RUB")} / {formatMinorUnits(item.amountLimit, "RUB")}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${pct * 100}%` },
                    over && styles.progressFillOver,
                  ]}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Бюджетов пока нет</Text>}
      />

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Новый бюджет (на месяц)</Text>
        <View style={styles.chipRow}>
          {(data?.expenseCategories ?? []).map((c) => (
            <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
          ))}
        </View>
        <TextField
          style={styles.field}
          placeholder="Лимит, 0,00"
          keyboardType="decimal-pad"
          value={limitText}
          onChangeText={setLimitText}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.saveButton} onPress={handleCreate} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? "Сохранение…" : "Добавить бюджет"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", padding: 20 },
  row: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e5ea" },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  rowTitle: { fontSize: 15, color: "#1c1c1e" },
  rowValue: { fontSize: 13, color: "#8a8a8e" },
  rowValueOver: { color: "#d70015" },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "#f0f0f2", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#1c1c1e" },
  progressFillOver: { backgroundColor: "#d70015" },
  empty: { color: "#8a8a8e", fontSize: 14, paddingVertical: 12 },
  form: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#e5e5ea", paddingTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#1c1c1e", marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  field: { marginBottom: 10 },
  saveButton: { backgroundColor: "#1c1c1e", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  saveButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  error: { color: "#c62828", fontSize: 14, marginBottom: 10 },
});
