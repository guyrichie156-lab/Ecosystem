import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { TextField, describeError, useAsyncData, useThemedStyles, type Theme } from "@ecosystem/core";
import { getBudgetStatuses } from "../lib/balance";
import { createBudget } from "../lib/budgets";
import { getExpenseCategories } from "../lib/categories";
import { formatMinorUnits } from "../lib/money";
import { checkBudgetForm } from "../lib/validation";
import { Chip } from "../components/Chip";

export function BudgetsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { data, loading, refreshing, refresh, pullToRefresh } = useAsyncData(async () => {
    const [statuses, expenseCategories] = await Promise.all([
      getBudgetStatuses(),
      getExpenseCategories(),
    ]);
    return { statuses, expenseCategories };
  }, []);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [limitText, setLimitText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const checked = checkBudgetForm({
      categoryId,
      limitText,
      budgetedCategoryIds: (data?.statuses ?? []).map((b) => b.categoryId),
    });
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createBudget(checked.value);
      setCategoryId(null);
      setLimitText("");
      refresh();
    } catch (e) {
      console.warn("Adding a budget failed:", describeError(e));
      setError("Не удалось добавить бюджет. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.statuses ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={pullToRefresh} />}
        renderItem={({ item }) => {
          const pct = item.amountLimit > 0 ? Math.min(1, item.spent / item.amountLimit) : 0;
          const over = item.spent > item.amountLimit;
          return (
            <View style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowTitle}>{item.categoryName}</Text>
                <Text style={[styles.rowValue, over && styles.rowValueOver]}>
                  {formatMinorUnits(item.spent)} / {formatMinorUnits(item.amountLimit)}
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

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background, padding: 20 },
    row: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.separator },
    rowHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    rowTitle: { fontSize: 15, color: t.text },
    rowValue: { fontSize: 13, color: t.textMuted },
    rowValueOver: { color: t.danger },
    progressTrack: { height: 6, borderRadius: 3, backgroundColor: t.fill, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: t.primary },
    progressFillOver: { backgroundColor: t.danger },
    empty: { color: t.textMuted, fontSize: 14, paddingVertical: 12 },
    form: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.separator, paddingTop: 16 },
    sectionTitle: { fontSize: 14, fontWeight: "600", color: t.text, marginBottom: 8 },
    chipRow: { flexDirection: "row", flexWrap: "wrap" },
    field: { marginBottom: 10 },
    saveButton: { backgroundColor: t.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    saveButtonText: { color: t.onPrimary, fontWeight: "700", fontSize: 16 },
    error: { color: t.danger, fontSize: 14, marginBottom: 10 },
  });
