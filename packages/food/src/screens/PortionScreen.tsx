import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Chip, PrimaryButton, TextField, describeError, useAsyncData, useThemedStyles, type Theme } from "@ecosystem/core";
import { entryTime } from "../lib/days";
import { addEntry, deleteEntry, getEntry, getFood, updateEntry, type Food } from "../lib/foods";
import { MEALS, formatKcal, formatTenths, mealAt, parseAmount, portion, type Meal } from "../lib/nutrition";

const QUICK_GRAMS = [50, 100, 150, 200];

/** How much of a food and for which meal; with `entryId` it edits an entry and can delete it. */
function PortionForm({
  food,
  initialGrams,
  initialMeal,
  onSave,
  onDelete,
}: {
  food: Food;
  initialGrams: number | null;
  initialMeal: Meal;
  onSave: (grams: number, meal: Meal) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const styles = useThemedStyles(makeStyles);
  const [gramsText, setGramsText] = useState(initialGrams === null ? "" : String(initialGrams));
  const [meal, setMeal] = useState<Meal>(initialMeal);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const grams = parseAmount(gramsText, 5000);
  const amount = typeof grams === "number" ? portion(food, grams) : null;

  async function handleSave() {
    if (typeof grams !== "number" || grams <= 0) {
      setError("Введите вес порции в граммах, от 1 до 5000.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(grams, meal);
    } catch (e) {
      console.warn("Saving a food entry failed:", describeError(e));
      setError("Не удалось сохранить. Попробуйте ещё раз.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await onDelete?.();
    } catch (e) {
      console.warn("Deleting a food entry failed:", describeError(e));
      setError("Не удалось удалить запись. Попробуйте ещё раз.");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: food.name }} />
      <Text style={styles.name}>{food.name}</Text>
      {food.brand && <Text style={styles.muted}>{food.brand}</Text>}
      <Text style={styles.per100}>
        На 100 г: {formatKcal(food.kcal)} ккал · Б {formatTenths(food.protein)} · Ж {formatTenths(food.fat)} · У{" "}
        {formatTenths(food.carbs)} г
      </Text>

      <Text style={styles.label}>Вес порции, г</Text>
      <TextField value={gramsText} onChangeText={setGramsText} keyboardType="number-pad" placeholder="Например, 150" accessibilityLabel="Граммы" />
      <View style={styles.chips}>
        {QUICK_GRAMS.map((g) => (
          <Chip key={g} label={`${g} г`} selected={grams === g} onPress={() => setGramsText(String(g))} />
        ))}
      </View>

      <Text style={styles.label}>Приём пищи</Text>
      <View style={styles.chips}>
        {MEALS.map((m) => (
          <Chip key={m.id} label={m.label} selected={meal === m.id} onPress={() => setMeal(m.id)} />
        ))}
      </View>

      <View style={styles.result}>
        <Text style={styles.resultKcal}>{amount ? `${formatKcal(amount.kcal)} ккал` : "— ккал"}</Text>
        {amount && (
          <Text style={styles.muted}>
            Белки {formatTenths(amount.protein)} г · Жиры {formatTenths(amount.fat)} г · Углеводы {formatTenths(amount.carbs)} г
          </Text>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton label={onDelete ? "Сохранить" : "Добавить"} busy={saving} onPress={handleSave} style={styles.save} />
      {onDelete && (
        <Pressable onPress={handleDelete} style={styles.delete} accessibilityRole="button">
          <Text style={styles.deleteText}>{confirmDelete ? "Точно удалить? Нажмите ещё раз" : "Удалить запись"}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

/** Adds a portion of a food to a day. */
export function PortionScreen({ foodId, day, meal }: { foodId: number; day: string; meal?: Meal }) {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { data: food } = useAsyncData(() => getFood(foodId), [foodId]);
  if (food === undefined) return <View style={styles.container} />;
  if (food === null) return <Text style={[styles.container, styles.missing]}>Продукт не найден.</Text>;
  return (
    <PortionForm
      food={food}
      initialGrams={null}
      initialMeal={meal ?? mealAt(new Date())}
      onSave={async (grams, chosenMeal) => {
        await addEntry({ food, grams, meal: chosenMeal, eatenAt: entryTime(day, new Date()) });
        router.dismissTo("/food");
      }}
    />
  );
}

/** Changes the weight or meal of an entry, or deletes it. */
export function EntryScreen({ entryId }: { entryId: number }) {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { data: entry } = useAsyncData(() => getEntry(entryId), [entryId]);
  if (entry === undefined) return <View style={styles.container} />;
  if (entry === null) return <Text style={[styles.container, styles.missing]}>Запись не найдена.</Text>;
  return (
    <PortionForm
      food={entry.food}
      initialGrams={entry.grams}
      initialMeal={entry.meal}
      onSave={async (grams, meal) => {
        await updateEntry(entry.id, { food: entry.food, grams, meal });
        router.back();
      }}
      onDelete={async () => {
        await deleteEntry(entry.id);
        router.back();
      }}
    />
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { padding: 20, paddingBottom: 40 },
    missing: { padding: 20, color: t.text },
    name: { fontSize: 20, fontWeight: "700", color: t.text },
    muted: { fontSize: 13, color: t.textMuted, marginTop: 2 },
    per100: { fontSize: 14, color: t.textSecondary, marginTop: 8 },
    label: { fontSize: 14, fontWeight: "600", color: t.text, marginTop: 20, marginBottom: 8 },
    chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
    result: { backgroundColor: t.card, borderRadius: 12, padding: 14, marginTop: 20 },
    resultKcal: { fontSize: 22, fontWeight: "700", color: t.text },
    error: { color: t.danger, fontSize: 14, marginTop: 12 },
    save: { marginTop: 20 },
    delete: { alignSelf: "center", marginTop: 16, padding: 8 },
    deleteText: { fontSize: 15, color: t.danger },
  });
