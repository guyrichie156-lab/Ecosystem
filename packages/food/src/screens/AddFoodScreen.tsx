import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { TextField, useAsyncData, useThemedStyles, type Theme } from "@ecosystem/core";
import { getRecentFoods, searchFoods, type Food } from "../lib/foods";
import { formatKcal } from "../lib/nutrition";

/** Query string that carries the chosen day and meal from screen to screen. */
export function dayMealQuery(day: string, meal?: string): string {
  return `day=${day}${meal ? `&meal=${meal}` : ""}`;
}

/** Picks a food: search, recent ones, the barcode scanner or a food typed in from the label. */
export function AddFoodScreen({ day, meal }: { day: string; meal?: string }) {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data } = useAsyncData(async () => {
    const [recent, found] = await Promise.all([query ? Promise.resolve([]) : getRecentFoods(), searchFoods(query, 100)]);
    return { recent, found };
  }, [query]);
  const params = dayMealQuery(day, meal);
  const open = (food: Food) => router.push(`/food/portion/${food.id}?${params}`);

  const recent = data?.recent ?? [];
  const recentIds = new Set(recent.map((f) => f.id));
  const rows: ({ header: string } | Food)[] = [
    ...(recent.length > 0 ? [{ header: "Недавние" }, ...recent] : []),
    { header: query ? "Найдено" : "Все продукты" },
    ...(data?.found ?? []).filter((f) => query || !recentIds.has(f.id)),
  ];

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={rows}
      keyExtractor={(row, i) => ("header" in row ? `h-${row.header}` : `f-${row.id}-${i}`)}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <TextField placeholder="Найти продукт" value={query} onChangeText={setQuery} accessibilityLabel="Найти продукт" autoFocus />
          <View style={styles.actions}>
            <Pressable style={styles.action} onPress={() => router.push(`/food/scan?${params}`)} accessibilityRole="button">
              <Text style={styles.actionText}>📷 Сканировать штрих-код</Text>
            </Pressable>
            <Pressable style={styles.action} onPress={() => router.push(`/food/custom?${params}`)} accessibilityRole="button">
              <Text style={styles.actionText}>✎ Свой продукт</Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item }) =>
        "header" in item ? (
          <Text style={styles.header}>{item.header}</Text>
        ) : (
          <Pressable style={styles.row} onPress={() => open(item)} accessibilityRole="button">
            <View style={styles.rowText}>
              <Text style={styles.name}>{item.name}</Text>
              {item.brand && <Text style={styles.muted}>{item.brand}</Text>}
            </View>
            <Text style={styles.muted}>{formatKcal(item.kcal)} ккал / 100 г</Text>
          </Pressable>
        )
      }
      ListFooterComponent={
        data && data.found.length === 0 ? (
          <Text style={styles.empty}>Не нашлось. Отсканируйте упаковку или внесите продукт с этикетки.</Text>
        ) : null
      }
    />
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { padding: 20, paddingBottom: 40 },
    actions: { flexDirection: "row", gap: 10, marginTop: 12 },
    action: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: t.border, paddingVertical: 10, alignItems: "center" },
    actionText: { fontSize: 14, fontWeight: "600", color: t.text },
    header: { fontSize: 13, fontWeight: "600", color: t.textMuted, marginTop: 20, marginBottom: 4 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 11,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.separator,
    },
    rowText: { flex: 1, marginRight: 8 },
    name: { fontSize: 15, color: t.text },
    muted: { fontSize: 13, color: t.textMuted },
    empty: { fontSize: 14, color: t.textMuted, marginTop: 16 },
  });
