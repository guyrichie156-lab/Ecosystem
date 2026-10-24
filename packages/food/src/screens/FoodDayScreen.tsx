import React, { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import {
  FLOATING_BUTTON_CLEARANCE,
  FloatingAddButton,
  useAsyncData,
  useRefreshOnFocus,
  useThemedStyles,
  useToday,
  type Theme,
} from "@ecosystem/core";
import { DaySwitcher } from "../components/DaySwitcher";
import { addDays, dayKey, dayStart } from "../lib/days";
import { getEntriesBetween } from "../lib/foods";
import { getNorm } from "../lib/norm";
import { MEALS, formatKcal, formatTenths, sumNutrients } from "../lib/nutrition";

/** «Еда»: what was eaten on a day, by meal, against the daily norm. */
export function FoodDayScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const today = useToday();
  // The day picked with the arrows; null is «today», which moves on at midnight.
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const day = pickedKey === null ? today : dayStart(pickedKey);
  const key = dayKey(day);
  const changeDay = (next: Date) => setPickedKey(dayKey(next) === dayKey(today) ? null : dayKey(next));
  const { data, refresh } = useAsyncData(async () => {
    const [entries, norm] = await Promise.all([getEntriesBetween(day.getTime(), addDays(day, 1).getTime()), getNorm()]);
    return { entries, norm };
  }, [key]);
  useRefreshOnFocus(refresh);

  const entries = data?.entries ?? [];
  const total = sumNutrients(entries);
  const norm = data?.norm.kcal ?? null;
  const share = norm ? Math.min(1, total.kcal / norm) : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <DaySwitcher day={day} today={today} onChange={changeDay} />
        <Link href="/food/norm" asChild>
          <Pressable style={styles.summary} accessibilityRole="button" accessibilityHint="Открывает норму калорий">
            <Text style={styles.muted}>Съедено</Text>
            <Text style={styles.eaten}>
              {formatKcal(total.kcal)} <Text style={styles.ofNorm}>{norm ? `из ${formatKcal(norm)} ккал` : "ккал"}</Text>
            </Text>
            {norm ? (
              <>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.round(share * 100)}%` }]} />
                </View>
                <Text style={styles.muted}>
                  {total.kcal <= norm
                    ? `Осталось ${formatKcal(norm - total.kcal)} ккал`
                    : `Сверх нормы на ${formatKcal(total.kcal - norm)} ккал`}{" "}
                  ›
                </Text>
              </>
            ) : (
              <Text style={styles.link}>Норма не задана — рассчитать ›</Text>
            )}
            <View style={styles.macros}>
              {[
                ["Белки", total.protein],
                ["Жиры", total.fat],
                ["Углеводы", total.carbs],
              ].map(([label, value]) => (
                <View key={label} style={styles.macro}>
                  <Text style={styles.macroValue}>{formatTenths(value as number)} г</Text>
                  <Text style={styles.muted}>{label}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        </Link>

        {MEALS.map((meal) => {
          const items = entries.filter((e) => e.meal === meal.id);
          const mealKcal = sumNutrients(items).kcal;
          return (
            <View key={meal.id} style={styles.meal}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>
                  {meal.label}
                  {items.length > 0 ? <Text style={styles.muted}> · {formatKcal(mealKcal)} ккал</Text> : null}
                </Text>
                <Pressable
                  onPress={() => router.push(`/food/add?meal=${meal.id}&day=${key}`)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Добавить: ${meal.label}`}
                >
                  <Text style={styles.plus}>+</Text>
                </Pressable>
              </View>
              {items.map((e) => (
                <Pressable key={e.id} style={styles.entry} onPress={() => router.push(`/food/entry/${e.id}`)} accessibilityRole="button">
                  <View style={styles.entryText}>
                    <Text style={styles.entryName} numberOfLines={1}>
                      {e.name}
                    </Text>
                    <Text style={styles.muted}>{e.grams} г</Text>
                  </View>
                  <Text style={styles.entryKcal}>{formatKcal(e.kcal)} ккал</Text>
                </Pressable>
              ))}
            </View>
          );
        })}

        <Text style={styles.footnote}>
          Базовые продукты — по данным USDA FoodData Central, отсканированные — из Open Food Facts.
        </Text>
        <Pressable onPress={() => Linking.openURL("https://world.openfoodfacts.org/")} accessibilityRole="link" hitSlop={8}>
          <Text style={styles.source}>Open Food Facts (ODbL) ↗</Text>
        </Pressable>
      </ScrollView>
      <Link href={`/food/add?day=${key}`} asChild>
        <FloatingAddButton label="Добавить еду" />
      </Link>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { paddingHorizontal: 20, paddingBottom: FLOATING_BUTTON_CLEARANCE },
    summary: { backgroundColor: t.card, borderRadius: 14, padding: 16, marginTop: 4 },
    muted: { fontSize: 13, color: t.textMuted },
    eaten: { fontSize: 30, fontWeight: "700", color: t.text, marginTop: 2 },
    ofNorm: { fontSize: 16, fontWeight: "400", color: t.textMuted },
    track: { height: 8, borderRadius: 4, backgroundColor: t.fill, overflow: "hidden", marginTop: 10, marginBottom: 6 },
    // One neutral colour whether under or over the norm: no red for eating more.
    fill: { height: "100%", backgroundColor: t.chart.slots[0] },
    link: { fontSize: 14, color: t.link, marginTop: 8 },
    macros: { flexDirection: "row", marginTop: 14 },
    macro: { flex: 1 },
    macroValue: { fontSize: 16, fontWeight: "600", color: t.text },
    meal: { marginTop: 22 },
    mealHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.separator,
    },
    mealTitle: { fontSize: 16, fontWeight: "600", color: t.text },
    plus: { fontSize: 26, color: t.link, paddingHorizontal: 6 },
    entry: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
    entryText: { flex: 1 },
    entryName: { fontSize: 15, color: t.text },
    entryKcal: { fontSize: 15, color: t.text, marginLeft: 8 },
    footnote: { fontSize: 12, color: t.textMuted, marginTop: 28 },
    source: { fontSize: 12, color: t.link, marginTop: 4 },
  });
