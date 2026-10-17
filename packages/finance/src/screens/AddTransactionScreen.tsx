import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  db,
  accounts as accountsTable,
  categories as categoriesTable,
  transactions as transactionsTable,
} from "@ecosystem/db";
import { useAsyncData } from "../hooks/useAsyncData";
import { parseMinorUnits } from "../lib/money";
import { runAfterTransactionChange } from "../lib/notifications";
import { Chip } from "../components/Chip";

type TxType = "income" | "expense" | "transfer";

function labelForType(t: TxType) {
  if (t === "income") return "Доход";
  if (t === "expense") return "Расход";
  return "Перевод";
}

export function AddTransactionScreen() {
  const router = useRouter();
  const { data } = useAsyncData(async () => {
    const [accs, cats] = await Promise.all([
      db.select().from(accountsTable),
      db.select().from(categoriesTable),
    ]);
    return { accounts: accs, categories: cats };
  }, []);

  const [type, setType] = useState<TxType>("expense");
  const [accountId, setAccountId] = useState<number | null>(null);
  const [counterpartAccountId, setCounterpartAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [amountText, setAmountText] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = (data?.categories ?? []).filter(
    (c) => c.kind === (type === "income" ? "income" : "expense")
  );

  function handleAccountChange(id: number) {
    setAccountId(id);
    // A transfer can't go to the account it comes from.
    if (counterpartAccountId === id) setCounterpartAccountId(null);
  }

  async function handleSave() {
    // Shown under the form rather than in Alert, which does nothing on web.
    const amount = parseMinorUnits(amountText);
    if (!amount || amount <= 0) {
      setError("Введите сумму, например 1500 или 1500,50.");
      return;
    }
    if (!accountId) {
      setError("Выберите счёт.");
      return;
    }
    if (type === "transfer" && (!counterpartAccountId || counterpartAccountId === accountId)) {
      setError("Выберите счёт получателя.");
      return;
    }
    setError(null);
    const account = data?.accounts.find((a) => a.id === accountId);
    if (!account) return;

    setSaving(true);
    try {
      await db.insert(transactionsTable).values({
        accountId,
        type,
        amount,
        currency: account.currency,
        categoryId: type === "transfer" ? null : categoryId,
        counterpartAccountId: type === "transfer" ? counterpartAccountId : null,
        occurredAt: Date.now(),
        note: note || null,
      });
      await runAfterTransactionChange({
        categoryId: type === "expense" ? categoryId : null,
        accountIds: type === "transfer" ? [accountId, counterpartAccountId!] : [accountId],
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Тип</Text>
      <View style={styles.chipRow}>
        {(["expense", "income", "transfer"] as TxType[]).map((t) => (
          <Chip key={t} label={labelForType(t)} selected={type === t} onPress={() => setType(t)} />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Счёт</Text>
      <View style={styles.chipRow}>
        {(data?.accounts ?? []).map((a) => (
          <Chip key={a.id} label={a.name} selected={accountId === a.id} onPress={() => handleAccountChange(a.id)} />
        ))}
      </View>

      {type === "transfer" && (
        <>
          <Text style={styles.sectionTitle}>Куда</Text>
          <View style={styles.chipRow}>
            {(data?.accounts ?? [])
              .filter((a) => a.id !== accountId)
              .map((a) => (
                <Chip
                  key={a.id}
                  label={a.name}
                  selected={counterpartAccountId === a.id}
                  onPress={() => setCounterpartAccountId(a.id)}
                />
              ))}
          </View>
        </>
      )}

      {type !== "transfer" && (
        <>
          <Text style={styles.sectionTitle}>Категория</Text>
          <View style={styles.chipRow}>
            {filteredCategories.map((c) => (
              <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Сумма</Text>
      <TextInput
        style={styles.input}
        placeholder="0,00"
        keyboardType="decimal-pad"
        value={amountText}
        onChangeText={setAmountText}
      />

      <Text style={styles.sectionTitle}>Заметка</Text>
      <TextInput style={styles.input} placeholder="Необязательно" value={note} onChangeText={setNote} />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? "Сохранение…" : "Сохранить"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#1c1c1e", marginTop: 16, marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d1d6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1c1c1e",
  },
  saveButton: {
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 28,
  },
  saveButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  error: { color: "#c62828", fontSize: 14, marginTop: 16 },
});
