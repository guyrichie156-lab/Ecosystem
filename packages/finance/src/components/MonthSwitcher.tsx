import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemedStyles, type Theme } from "@ecosystem/core";
import { addMonths, compareMonths, monthOf, type Month } from "../lib/period";

const monthLabel = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });

export const formatMonth = (m: Month) => monthLabel.format(new Date(m.year, m.month, 1));

/** "‹ август 2026 г. ›": steps through months; there is no month after the current one. */
export function MonthSwitcher({ month, onChange }: { month: Month; onChange: (month: Month) => void }) {
  const styles = useThemedStyles(makeStyles);
  const canGoForward = compareMonths(month, monthOf(new Date())) < 0;
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(addMonths(month, -1))}
        hitSlop={12}
        style={styles.arrow}
        accessibilityRole="button"
        accessibilityLabel="Предыдущий месяц"
      >
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <Text style={styles.label}>{formatMonth(month)}</Text>
      <Pressable
        onPress={() => onChange(addMonths(month, 1))}
        disabled={!canGoForward}
        hitSlop={12}
        style={styles.arrow}
        accessibilityRole="button"
        accessibilityLabel="Следующий месяц"
        accessibilityState={{ disabled: !canGoForward }}
      >
        <Text style={[styles.arrowText, !canGoForward && styles.arrowDisabled]}>›</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
    arrow: { width: 44, height: 36, alignItems: "center", justifyContent: "center" },
    arrowText: { fontSize: 28, color: t.text, lineHeight: 32 },
    arrowDisabled: { color: t.separator },
    label: { fontSize: 17, fontWeight: "600", color: t.text },
  });
