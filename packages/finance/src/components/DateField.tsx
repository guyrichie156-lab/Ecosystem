import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Chip, useThemedStyles, type Theme } from "@ecosystem/core";
import { addMonths, calendarWeeks, compareMonths, monthOf, startOfDay, type Month } from "../lib/period";
import { monthYearFormat as monthFormat } from "../lib/format";

const dayFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAY = 24 * 60 * 60 * 1000;

/**
 * The day of a record: «Сегодня», «Вчера» or any past day from a month calendar. Plain JS, no
 * native date picker, so nothing has to be added to the Android build. Future days can't be picked.
 */
export function DateField({ value, onChange }: { value: number; onChange: (day: number) => void }) {
  const styles = useThemedStyles(makeStyles);
  const today = startOfDay(Date.now());
  // Half a day back is always yesterday, also on the days the clocks change (a day of 23 or 25 hours).
  const yesterday = startOfDay(today - DAY / 2);
  const day = startOfDay(value);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState<Month>(() => monthOf(new Date(value)));
  const canGoForward = compareMonths(shown, monthOf(new Date(today))) < 0;

  return (
    <View>
      <View style={styles.chips}>
        <Chip label="Сегодня" selected={day === today} onPress={() => onChange(today)} />
        <Chip label="Вчера" selected={day === yesterday} onPress={() => onChange(yesterday)} />
        <Chip
          label={day === today || day === yesterday ? "Другой день" : dayFormat.format(new Date(day))}
          selected={day !== today && day !== yesterday}
          onPress={() => {
            setShown(monthOf(new Date(day)));
            setOpen(!open);
          }}
        />
      </View>
      {open && (
        <View style={styles.calendar}>
          <View style={styles.calendarHeader}>
            <Pressable onPress={() => setShown(addMonths(shown, -1))} hitSlop={12} accessibilityLabel="Предыдущий месяц">
              <Text style={styles.arrow}>‹</Text>
            </Pressable>
            <Text style={styles.calendarTitle}>{monthFormat.format(new Date(shown.year, shown.month, 1))}</Text>
            <Pressable
              onPress={() => setShown(addMonths(shown, 1))}
              disabled={!canGoForward}
              hitSlop={12}
              accessibilityLabel="Следующий месяц"
            >
              <Text style={[styles.arrow, !canGoForward && styles.disabled]}>›</Text>
            </Pressable>
          </View>
          <View style={styles.week}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>
          {calendarWeeks(shown).map((week, i) => (
            <View key={i} style={styles.week}>
              {week.map((d, j) => {
                if (d === null) return <View key={j} style={styles.cell} />;
                const time = new Date(shown.year, shown.month, d).getTime();
                const future = time > today;
                const selected = time === day;
                return (
                  <Pressable
                    key={j}
                    style={[styles.cell, selected && styles.cellSelected]}
                    disabled={future}
                    onPress={() => {
                      onChange(time);
                      setOpen(false);
                    }}
                    accessibilityLabel={dayFormat.format(new Date(time))}
                    accessibilityState={{ selected, disabled: future }}
                  >
                    <Text style={[styles.dayText, selected && styles.dayTextSelected, future && styles.disabled]}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    chips: { flexDirection: "row", flexWrap: "wrap" },
    calendar: { backgroundColor: t.card, borderRadius: 14, padding: 10, marginTop: 4 },
    calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 8, marginBottom: 6 },
    calendarTitle: { fontSize: 16, fontWeight: "600", color: t.text },
    arrow: { fontSize: 26, color: t.text, paddingHorizontal: 8 },
    week: { flexDirection: "row" },
    weekday: { flex: 1, textAlign: "center", fontSize: 12, color: t.textMuted, paddingVertical: 4 },
    cell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 20 },
    cellSelected: { backgroundColor: t.primary },
    dayText: { fontSize: 15, color: t.text },
    dayTextSelected: { color: t.onPrimary, fontWeight: "700" },
    disabled: { color: t.separator },
  });
