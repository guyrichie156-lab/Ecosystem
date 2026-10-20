import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { PrimaryButton, TextField, describeError, useThemedStyles, type Theme } from "@ecosystem/core";
import { saveFood } from "../lib/foods";
import { parseAmount } from "../lib/nutrition";

export type CustomFoodPrefill = {
  barcode?: string;
  name?: string;
  brand?: string;
  /** Per 100 g, in the units of nutrition.ts; whatever Open Food Facts had. */
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
};

const FIELDS = [
  { key: "kcal", label: "Ккал", max: 900, scale: 1 },
  { key: "protein", label: "Белки, г", max: 100, scale: 10 },
  { key: "fat", label: "Жиры, г", max: 100, scale: 10 },
  { key: "carbs", label: "Углеводы, г", max: 100, scale: 10 },
] as const;

/**
 * A food typed in from its label (nutrition per 100 g), or completed after a barcode scan that
 * Open Food Facts didn't know fully. Saved to «Мои продукты», then the portion is asked.
 */
export function CustomFoodScreen({ prefill, query }: { prefill: CustomFoodPrefill; query: string }) {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [name, setName] = useState(prefill.name ?? "");
  const [brand, setBrand] = useState(prefill.brand ?? "");
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      FIELDS.map((f) => {
        const v = prefill[f.key];
        return [f.key, v === undefined ? "" : String(v / f.scale).replace(".", ",")];
      })
    )
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      setError("Введите название.");
      return;
    }
    const per100g: Record<string, number> = {};
    for (const f of FIELDS) {
      const parsed = parseAmount(values[f.key], f.max, f.scale);
      if (typeof parsed !== "number") {
        setError(`${f.label}: число на 100 г, от 0 до ${f.max}.`);
        return;
      }
      per100g[f.key] = parsed;
    }
    setError(null);
    setSaving(true);
    try {
      const id = await saveFood({
        name: name.trim(),
        brand: brand.trim() || null,
        barcode: prefill.barcode ?? null,
        source: "custom",
        per100g: { kcal: per100g.kcal, protein: per100g.protein, fat: per100g.fat, carbs: per100g.carbs },
      });
      router.replace(`/food/portion/${id}?${query}`);
    } catch (e) {
      console.warn("Saving a food failed:", describeError(e));
      setError("Не удалось сохранить продукт. Попробуйте ещё раз.");
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {prefill.barcode && (
        <Text style={styles.hint}>
          Штрих-код {prefill.barcode}: в Open Food Facts этого продукта нет или не хватает данных. Перепишите их с этикетки —
          продукт сохранится, и в следующий раз сканер его узнает.
        </Text>
      )}
      <Text style={styles.label}>Название</Text>
      <TextField value={name} onChangeText={setName} placeholder="Например, творог 5 %" accessibilityLabel="Название" />
      <Text style={styles.label}>Марка (необязательно)</Text>
      <TextField value={brand} onChangeText={setBrand} placeholder="Например, название фирмы" accessibilityLabel="Марка" />
      <Text style={styles.section}>На 100 г — как на этикетке</Text>
      <View style={styles.grid}>
        {FIELDS.map((f) => (
          <View key={f.key} style={styles.cell}>
            <Text style={styles.small}>{f.label}</Text>
            <TextField
              value={values[f.key]}
              onChangeText={(text) => setValues((prev) => ({ ...prev, [f.key]: text }))}
              keyboardType="decimal-pad"
              placeholder="0"
              accessibilityLabel={`${f.label} на 100 г`}
            />
          </View>
        ))}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton label="Сохранить продукт" busy={saving} onPress={handleSave} style={styles.save} />
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { padding: 20, paddingBottom: 40 },
    hint: { fontSize: 14, color: t.textSecondary, backgroundColor: t.card, borderRadius: 12, padding: 12 },
    label: { fontSize: 14, fontWeight: "600", color: t.text, marginTop: 16, marginBottom: 8 },
    section: { fontSize: 15, fontWeight: "600", color: t.text, marginTop: 22 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
    cell: { width: "47%" },
    small: { fontSize: 13, color: t.textMuted, marginBottom: 4 },
    error: { color: t.danger, fontSize: 14, marginTop: 14 },
    save: { marginTop: 22 },
  });
