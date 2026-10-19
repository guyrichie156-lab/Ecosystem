import React, { useState } from "react";
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { TextField, describeError, useAsyncData, useRefreshOnFocus, useThemedStyles, type Theme } from "@ecosystem/core";
import { createAccount, getAccountsWithBalances, type AccountType } from "../lib/accounts";
import { runAfterAccountChange } from "../lib/afterChange";
import { formatMinorUnits } from "../lib/money";
import { checkAccountForm } from "../lib/validation";
import { Chip } from "../components/Chip";

function labelForAccountType(t: AccountType) {
  if (t === "cash") return "Наличные";
  if (t === "bank") return "Банк";
  if (t === "card") return "Карта";
  return "Сбережения";
}

export function AccountsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { data, loading, refreshing, refresh, pullToRefresh } = useAsyncData(getAccountsWithBalances, []);
  useRefreshOnFocus(refresh);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("cash");
  const [initialBalanceText, setInitialBalanceText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const checked = checkAccountForm({ name, initialBalanceText });
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createAccount({ ...checked.value, type });
      await runAfterAccountChange();
      setName("");
      setInitialBalanceText("");
      refresh();
    } catch (e) {
      console.warn("Adding an account failed:", describeError(e));
      setError("Не удалось добавить счёт. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={pullToRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{item.name}</Text>
            <Text style={styles.rowValue}>{formatMinorUnits(item.balance, item.currency)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Счетов пока нет</Text>}
      />

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Новый счёт</Text>
        <View style={styles.chipRow}>
          {(["cash", "bank", "card", "savings"] as AccountType[]).map((t) => (
            <Chip key={t} label={labelForAccountType(t)} selected={type === t} onPress={() => setType(t)} />
          ))}
        </View>
        <TextField style={styles.field} placeholder="Название счёта" value={name} onChangeText={setName} />
        <TextField
          style={styles.field}
          placeholder="Начальный баланс, 0,00"
          // decimal-pad has no minus key on iOS; this keyboard has one.
          keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
          value={initialBalanceText}
          onChangeText={setInitialBalanceText}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.saveButton} onPress={handleCreate} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? "Сохранение…" : "Добавить счёт"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background, padding: 20 },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.separator,
    },
    rowTitle: { fontSize: 15, color: t.text },
    rowValue: { fontSize: 15, color: t.text, fontWeight: "600" },
    empty: { color: t.textMuted, fontSize: 14, paddingVertical: 12 },
    form: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.separator, paddingTop: 16 },
    sectionTitle: { fontSize: 14, fontWeight: "600", color: t.text, marginBottom: 8 },
    chipRow: { flexDirection: "row", flexWrap: "wrap" },
    field: { marginBottom: 10 },
    saveButton: { backgroundColor: t.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    saveButtonText: { color: t.onPrimary, fontWeight: "700", fontSize: 16 },
    error: { color: t.danger, fontSize: 14, marginBottom: 10 },
  });
