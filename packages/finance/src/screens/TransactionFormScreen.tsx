import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Chip, PrimaryButton, TextField, describeError, useAsyncData, useThemedStyles, type Theme } from "@ecosystem/core";
import { useRouter } from "expo-router";
import { checkTransactionForm } from "../lib/validation";
import { runAfterTransactionChange } from "../lib/afterChange";
import {
  addTransaction,
  deleteTransaction,
  getTransactionFormData,
  updateTransaction,
  type TransactionType,
} from "../lib/transactions";
import { DateField } from "../components/DateField";
import { occurredAtFor, startOfDay } from "../lib/period";

function labelForType(t: TransactionType) {
  if (t === "income") return "Доход";
  if (t === "expense") return "Расход";
  return "Перевод";
}

/** Kopecks -> the text a user would type, e.g. 150050 -> "1500,50", 150000 -> "1500". */
function minorUnitsToInput(minorUnits: number): string {
  const major = minorUnits / 100;
  return (Number.isInteger(major) ? String(major) : major.toFixed(2)).replace(".", ",");
}

export function AddTransactionScreen() {
  return <TransactionForm />;
}

export function EditTransactionScreen({ transactionId }: { transactionId: number }) {
  return <TransactionForm transactionId={transactionId} />;
}

function TransactionForm({ transactionId }: { transactionId?: number }) {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const isEdit = transactionId !== undefined;
  const { data } = useAsyncData(() => getTransactionFormData(transactionId), [transactionId]);

  const [type, setType] = useState<TransactionType>("expense");
  const [accountId, setAccountId] = useState<number | null>(null);
  const [counterpartAccountId, setCounterpartAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [amountText, setAmountText] = useState("");
  const [note, setNote] = useState("");
  const [day, setDay] = useState(() => startOfDay(Date.now()));
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fill the form once the transaction being edited has loaded.
  const existing = data?.existing;
  useEffect(() => {
    if (!existing) return;
    setType(existing.type);
    setAccountId(existing.accountId);
    setCounterpartAccountId(existing.counterpartAccountId);
    setCategoryId(existing.categoryId);
    setAmountText(minorUnitsToInput(existing.amount));
    setNote(existing.note ?? "");
    setDay(startOfDay(existing.occurredAt));
  }, [existing]);

  const filteredCategories = (data?.categories ?? []).filter(
    (c) => c.kind === (type === "income" ? "income" : "expense")
  );

  function handleTypeChange(next: TransactionType) {
    if (next === type) return;
    setType(next);
    // Income and expense have different categories, so the old choice no longer fits.
    setCategoryId(null);
  }

  function handleAccountChange(id: number) {
    setAccountId(id);
    // A transfer can't go to the account it comes from.
    if (counterpartAccountId === id) setCounterpartAccountId(null);
  }

  async function handleSave() {
    // Shown under the form rather than in Alert, which does nothing on web.
    const checked = checkTransactionForm({ type, amountText, accountId, counterpartAccountId });
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setError(null);
    const { amount, accountId: fromAccountId } = checked.value;
    const account = data?.accounts.find((a) => a.id === fromAccountId);
    if (!account) return;

    const input = {
      accountId: fromAccountId,
      type,
      amount,
      currency: account.currency,
      categoryId: type === "transfer" ? null : categoryId,
      counterpartAccountId: checked.value.counterpartAccountId,
      note: note || null,
      // An edited record keeps its exact time unless its day was changed.
      occurredAt: existing && startOfDay(existing.occurredAt) === day ? undefined : occurredAtFor(day, Date.now()),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateTransaction(transactionId, input);
      } else {
        await addTransaction(input);
      }
      await runAfterTransactionChange({
        categoryId: type === "expense" ? categoryId : null,
        accountIds: input.counterpartAccountId ? [fromAccountId, input.counterpartAccountId] : [fromAccountId],
      });
      router.back();
    } catch (e) {
      console.warn("Saving a record failed:", describeError(e));
      setError("Не удалось сохранить запись. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    // Two taps instead of a dialog: Alert has no buttons on web.
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setSaving(true);
    try {
      await deleteTransaction(transactionId);
      // Deleting only lowers spending or restores a balance, so there is nothing to alert about.
      await runAfterTransactionChange({ categoryId: null, accountIds: [] });
      router.back();
    } catch (e) {
      console.warn("Deleting a record failed:", describeError(e));
      setError("Не удалось удалить запись. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && data && !existing) {
    return (
      <View style={styles.container}>
        <Text style={styles.missing}>Запись не найдена — возможно, она уже удалена.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Тип</Text>
      <View style={styles.chipRow}>
        {(["expense", "income", "transfer"] as TransactionType[]).map((t) => (
          <Chip key={t} label={labelForType(t)} selected={type === t} onPress={() => handleTypeChange(t)} />
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
              <Chip
                key={c.id}
                label={c.icon ? `${c.icon} ${c.name}` : c.name}
                selected={categoryId === c.id}
                onPress={() => setCategoryId(c.id)}
              />
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Сумма</Text>
      <TextField
        placeholder="0,00"
        keyboardType="decimal-pad"
        value={amountText}
        onChangeText={setAmountText}
      />

      <Text style={styles.sectionTitle}>Дата</Text>
      <DateField value={day} onChange={setDay} />

      <Text style={styles.sectionTitle}>Заметка</Text>
      <TextField placeholder="Необязательно" value={note} onChangeText={setNote} />

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton label="Сохранить" busy={saving} onPress={handleSave} style={styles.saveButton} />

      {isEdit && (
        <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={saving}>
          <Text style={styles.deleteButtonText}>
            {confirmingDelete ? "Нажмите ещё раз, чтобы удалить" : "Удалить запись"}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { padding: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 14, fontWeight: "600", color: t.text, marginTop: 16, marginBottom: 8 },
    chipRow: { flexDirection: "row", flexWrap: "wrap" },
    saveButton: { marginTop: 28 },
    deleteButton: {
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 12,
      backgroundColor: t.dangerBg,
    },
    deleteButtonText: { color: t.danger, fontWeight: "600", fontSize: 16 },
    missing: { padding: 20, fontSize: 15, color: t.textMuted },
    error: { color: t.danger, fontSize: 14, marginTop: 16 },
  });
