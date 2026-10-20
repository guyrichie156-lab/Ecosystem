import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemedStyles, type Theme } from "@ecosystem/core";
import { addDays, dayKey } from "../lib/days";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", weekday: "short" });

/** ‹ day ›; the arrow to the future stops at today. */
export function DaySwitcher({ day, today, onChange }: { day: Date; today: Date; onChange: (day: Date) => void }) {
  const styles = useThemedStyles(makeStyles);
  const key = dayKey(day);
  const isToday = key === dayKey(today);
  const label = isToday ? "Сегодня" : key === dayKey(addDays(today, -1)) ? "Вчера" : dateFormat.format(day);
  return (
    <View style={styles.row}>
      <Pressable onPress={() => onChange(addDays(day, -1))} hitSlop={12} accessibilityRole="button" accessibilityLabel="Предыдущий день">
        <Text style={styles.arrow}>‹</Text>
      </Pressable>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => onChange(addDays(day, 1))}
        disabled={isToday}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Следующий день"
      >
        <Text style={[styles.arrow, isToday && styles.disabled]}>›</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
    arrow: { fontSize: 30, color: t.text, paddingHorizontal: 12 },
    disabled: { color: t.separator },
    label: { fontSize: 17, fontWeight: "600", color: t.text },
  });
