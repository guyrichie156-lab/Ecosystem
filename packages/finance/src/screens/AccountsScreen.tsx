import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { db, accounts as accountsTable } from "@ecosystem/db";
import { useAsyncData } from "../hooks/useAsyncData";
import { getAccountBalance } from "../lib/balance";
import { formatMinorUnits, parseMinorUnits } from "../lib/money";
import { Chip } from "../components/Chip";

type AccountType = "cash" | "bank" | "card" | "savings";

function labelForAccountType(t: AccountType) {
  if (t === "cash") return "Наличные";
  if (t === "bank") return "Банк";
  if (t === "card") return "Карта";
  return "Сбережения";
}

export function AccountsScreen() {
  const { data, loading, refresh } = useAsyncData(async () => {
    const accs = await db.select().from(accountsTable);
    return Promise.all(accs.map(async (a) => ({ ...a, balance: await getAccountBalance(a.id) })));
  }, []);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("cash");
  const [initialBalanceText, setInitialBalanceText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    const initial = parseMinorUnits(initialBalanceText || "0") ?? 0;
    setSaving(true);
    try {
      await db.insert(accountsTable).values({
        name: name.trim(),
        type,
        currency: "RUB",
        initialBalance: initial,
      });
      setName("");
      setInitialBalanceText("");
      refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
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
        <TextInput style={styles.input} placeholder="Название счёта" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder="Начальный баланс, 0,00"
          keyboardType="decimal-pad"
          value={initialBalanceText}
          onChangeText={setInitialBalanceText}
        />
        <Pressable style={styles.saveButton} onPress={handleCreate} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? "Сохранение…" : "Добавить счёт"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", padding: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5ea",
  },
  rowTitle: { fontSize: 15, color: "#1c1c1e" },
  rowValue: { fontSize: 15, color: "#1c1c1e", fontWeight: "600" },
  empty: { color: "#8a8a8e", fontSize: 14, paddingVertical: 12 },
  form: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#e5e5ea", paddingTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#1c1c1e", marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d1d6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1c1c1e",
    marginBottom: 10,
  },
  saveButton: { backgroundColor: "#1c1c1e", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  saveButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
});
