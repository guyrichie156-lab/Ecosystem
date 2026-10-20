import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useAsyncData, useRefreshOnFocus, useThemedStyles, type Theme } from "@ecosystem/core";
import { BodyMap, exerciseHighlights } from "../components/BodyMap";
import { EQUIPMENT_LABELS, alternativesTo, exerciseSourceUrl, getExercise } from "../lib/exercises";
import { MUSCLES, type Muscle } from "../lib/muscles";
import { formatWeightKg } from "../lib/training";
import { getExerciseHistory } from "../lib/workouts";

const dayFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const labels = (muscles: Muscle[]) => muscles.map((m) => MUSCLES[m].label).join(", ");

/** An exercise: its muscles on the figure, equipment, the user's last results and alternatives. */
export function ExerciseDetailScreen({ exerciseId }: { exerciseId: string }) {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const exercise = getExercise(exerciseId);
  const { data: history, refresh } = useAsyncData(() => getExerciseHistory(exerciseId), [exerciseId]);
  useRefreshOnFocus(refresh);

  if (!exercise) return <Text style={[styles.container, styles.missing]}>Упражнение не найдено.</Text>;
  const highlights = exerciseHighlights(exercise.primary, exercise.secondary);
  const unit = exercise.unit === "seconds" ? "сек" : "";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: exercise.name }} />
      <View style={styles.figures}>
        <BodyMap highlights={highlights} side="front" scale={0.7} />
        <BodyMap highlights={highlights} side="back" scale={0.7} />
      </View>
      <Text style={styles.legend}>Ярче — основные мышцы, бледнее — помогающие.</Text>

      <Text style={styles.label}>Основные мышцы</Text>
      <Text style={styles.value}>{labels(exercise.primary)}</Text>
      {exercise.secondary.length > 0 && (
        <>
          <Text style={styles.label}>Помогают</Text>
          <Text style={styles.value}>{labels(exercise.secondary)}</Text>
        </>
      )}
      <Text style={styles.label}>Оборудование</Text>
      <Text style={styles.value}>{EQUIPMENT_LABELS[exercise.equipment]}</Text>

      <Text style={styles.section}>Мои результаты</Text>
      {history && history.length === 0 && <Text style={styles.muted}>Это упражнение ещё не выполнялось.</Text>}
      {(history ?? []).map((w) => (
        <View key={w.finishedAt} style={styles.historyRow}>
          <Text style={styles.historyDate}>{dayFormat.format(new Date(w.finishedAt))}</Text>
          <Text style={styles.historySets}>
            {w.sets
              .map((s) => `${s.weightGrams !== null ? `${formatWeightKg(s.weightGrams)} кг × ` : ""}${s.reps ?? "—"}${unit ? ` ${unit}` : ""}`)
              .join(", ")}
          </Text>
        </View>
      ))}

      <Text style={styles.section}>Альтернативы</Text>
      {alternativesTo(exercise).map((e) => (
        <Pressable key={e.id} style={styles.altRow} onPress={() => router.push(`/health/exercise/${e.id}`)} accessibilityRole="button">
          <Text style={styles.altName}>{e.name}</Text>
          <Text style={styles.muted}>{EQUIPMENT_LABELS[e.equipment]}</Text>
        </Pressable>
      ))}

      <Pressable onPress={() => Linking.openURL(exerciseSourceUrl(exercise))} accessibilityRole="link" hitSlop={8}>
        <Text style={styles.source}>Мышцы и оборудование: free-exercise-db ↗</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { padding: 20, paddingBottom: 40 },
    missing: { padding: 20, color: t.text },
    figures: { flexDirection: "row", justifyContent: "center" },
    legend: { fontSize: 12, color: t.textMuted, textAlign: "center", marginTop: 4 },
    label: { fontSize: 13, color: t.textMuted, marginTop: 14 },
    value: { fontSize: 16, color: t.text, marginTop: 2 },
    section: { fontSize: 17, fontWeight: "600", color: t.text, marginTop: 26, marginBottom: 6 },
    muted: { fontSize: 13, color: t.textMuted },
    historyRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.separator },
    historyDate: { fontSize: 13, color: t.textMuted },
    historySets: { fontSize: 15, color: t.text, marginTop: 2 },
    altRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.separator },
    altName: { fontSize: 15, color: t.text },
    source: { fontSize: 12, color: t.link, marginTop: 20 },
  });
