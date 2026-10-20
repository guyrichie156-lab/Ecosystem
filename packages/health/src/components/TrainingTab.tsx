import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { PrimaryButton, describeError, useAsyncData, useRefreshOnFocus, useThemedStyles, type Theme } from "@ecosystem/core";
import { getExercise } from "../lib/exercises";
import { getMeasurementSeries } from "../lib/measurements";
import { MUSCLES, type Muscle } from "../lib/muscles";
import { getHealthTips } from "../lib/tips";
import { pickNextTemplate } from "../lib/training";
import {
  getRecentWorkouts,
  getTemplates,
  getUnfinishedWorkout,
  startWorkout,
  type TemplateExercise,
  type WorkoutTemplate,
} from "../lib/workouts";
import { BodyMap, exerciseHighlights } from "./BodyMap";
import { TipCarousel } from "./TipCarousel";

const dayFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

/** "3 × 10" or, for a held exercise, "3 × 30 сек". */
export function setsLabel(e: TemplateExercise): string {
  return `${e.sets} × ${e.reps}${getExercise(e.exerciseId)?.unit === "seconds" ? " сек" : ""}`;
}

/** Main and helping muscles of a whole workout, for its figures and caption. */
function templateMuscles(template: WorkoutTemplate): { primary: Muscle[]; secondary: Muscle[] } {
  const primary = new Set<Muscle>();
  const secondary = new Set<Muscle>();
  for (const e of template.exercises) {
    const exercise = getExercise(e.exerciseId);
    exercise?.primary.forEach((m) => primary.add(m));
    exercise?.secondary.forEach((m) => secondary.add(m));
  }
  return { primary: [...primary], secondary: [...secondary].filter((m) => !primary.has(m)) };
}

function MiniFigures({ template, scale }: { template: WorkoutTemplate; scale: number }) {
  const styles = useThemedStyles(makeStyles);
  const { primary, secondary } = templateMuscles(template);
  const highlights = exerciseHighlights(primary, secondary);
  return (
    <View style={styles.figures} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <BodyMap highlights={highlights} side="front" scale={scale} />
      <BodyMap highlights={highlights} side="back" scale={scale} />
    </View>
  );
}

function TemplateCard({ template, onStart }: { template: WorkoutTemplate; onStart: (t: WorkoutTemplate) => void }) {
  const styles = useThemedStyles(makeStyles);
  const { primary } = templateMuscles(template);
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <MiniFigures template={template} scale={0.22} />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{template.name}</Text>
          <Text style={styles.muted}>{primary.map((m) => MUSCLES[m].label).join(", ") || "Нет упражнений"}</Text>
          <Text style={styles.muted}>
            Упражнений: {template.exercises.length}
            {template.lastDoneAt ? ` · последний раз ${dayFormat.format(new Date(template.lastDoneAt))}` : ""}
          </Text>
        </View>
      </View>
      <View style={styles.cardButtons}>
        <Pressable
          style={[styles.smallButton, styles.smallButtonMain]}
          onPress={() => onStart(template)}
          disabled={template.exercises.length === 0}
          accessibilityRole="button"
          accessibilityLabel={`Начать: ${template.name}`}
        >
          <Text style={styles.smallButtonMainText}>Начать</Text>
        </Pressable>
        <Link href={`/health/template/${template.id}`} asChild>
          <Pressable style={styles.smallButton} accessibilityRole="button" accessibilityLabel={`Изменить: ${template.name}`}>
            <Text style={styles.smallButtonText}>Изменить</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

/** «Тренировка»: the workout to do next, the user's workouts, recent workouts, tips at the bottom. */
export function TrainingTab() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [startError, setStartError] = useState<string | null>(null);
  const { data, loading, refreshing, refresh, pullToRefresh } = useAsyncData(async () => {
    const [templates, unfinished, recent, weightSeries] = await Promise.all([
      getTemplates(),
      getUnfinishedWorkout(),
      getRecentWorkouts(5),
      getMeasurementSeries("weight"),
    ]);
    return { templates, unfinished, recent, tips: getHealthTips({ weightSeries }) };
  }, []);
  useRefreshOnFocus(refresh);

  async function start(template: WorkoutTemplate) {
    setStartError(null);
    try {
      const id = await startWorkout({ name: template.name, templateId: template.id, exercises: template.exercises });
      router.push(`/health/workout/${id}`);
    } catch (e) {
      console.warn("Starting a workout failed:", describeError(e));
      setStartError("Не удалось начать тренировку. Попробуйте ещё раз.");
    }
  }

  const next = pickNextTemplate((data?.templates ?? []).filter((t) => t.exercises.length > 0));

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={data?.templates ?? []}
      keyExtractor={(t) => String(t.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={pullToRefresh} />}
      ListHeaderComponent={
        <View>
          {data?.unfinished && (
            <Link href={`/health/workout/${data.unfinished.id}`} asChild>
              <Pressable style={styles.banner} accessibilityRole="button">
                <Text style={styles.bannerText}>Тренировка не закончена: {data.unfinished.name}</Text>
                <Text style={styles.bannerAction}>Продолжить ›</Text>
              </Pressable>
            </Link>
          )}
          {next && (
            <View style={styles.nextCard}>
              <Text style={styles.sectionLabel}>Следующая тренировка</Text>
              <View style={styles.cardRow}>
                <MiniFigures template={next} scale={0.3} />
                <View style={styles.cardText}>
                  <Text style={styles.nextTitle}>{next.name}</Text>
                  {next.exercises.map((e, i) => (
                    <View key={`${e.exerciseId}-${i}`} style={styles.nextLine}>
                      <Text style={styles.nextName} numberOfLines={1}>
                        {getExercise(e.exerciseId)?.name ?? e.exerciseId}
                      </Text>
                      <Text style={styles.nextSets}>{setsLabel(e)}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <PrimaryButton label="Начать" onPress={() => start(next)} style={styles.startButton} />
            </View>
          )}
          {startError && <Text style={styles.error}>{startError}</Text>}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Мои комплексы</Text>
            <Link href="/health/template/new" asChild>
              <Pressable hitSlop={8} accessibilityRole="button">
                <Text style={styles.link}>+ Новый</Text>
              </Pressable>
            </Link>
          </View>
          {!loading && data?.templates.length === 0 && (
            <Text style={styles.muted}>Комплексов нет — соберите свой кнопкой «+ Новый».</Text>
          )}
        </View>
      }
      renderItem={({ item }) => <TemplateCard template={item} onStart={start} />}
      ListFooterComponent={
        <View>
          {data && data.recent.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, styles.spaced]}>Последние тренировки</Text>
              {data.recent.map((w) => (
                <View key={w.id} style={styles.historyRow}>
                  <Text style={styles.historyName} numberOfLines={1}>
                    {w.name}
                  </Text>
                  <Text style={styles.muted}>
                    {dayFormat.format(new Date(w.finishedAt))} · подходов: {w.sets}
                  </Text>
                </View>
              ))}
            </>
          )}
          {data && (
            <View style={styles.tips}>
              <TipCarousel tips={data.tips} />
              <Text style={styles.disclaimer}>
                Подсказки — справочная информация из открытых рекомендаций, не медицинская консультация.
              </Text>
            </View>
          )}
        </View>
      }
    />
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    list: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    banner: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: t.accent,
      borderRadius: 12,
      padding: 14,
      marginTop: 8,
    },
    bannerText: { flex: 1, fontSize: 14, fontWeight: "600", color: t.onAccent },
    bannerAction: { fontSize: 14, fontWeight: "700", color: t.onAccent, marginLeft: 8 },
    nextCard: { backgroundColor: t.card, borderRadius: 14, padding: 14, marginTop: 12 },
    sectionLabel: { fontSize: 13, color: t.textMuted, marginBottom: 8 },
    nextTitle: { fontSize: 18, fontWeight: "700", color: t.text, marginBottom: 6 },
    nextLine: { flexDirection: "row", marginTop: 3 },
    nextName: { flex: 1, fontSize: 14, color: t.textSecondary },
    nextSets: { fontSize: 14, color: t.textMuted, marginLeft: 8 },
    startButton: { marginTop: 12 },
    error: { color: t.danger, fontSize: 14, marginTop: 8 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 24, marginBottom: 8 },
    sectionTitle: { fontSize: 17, fontWeight: "600", color: t.text },
    spaced: { marginTop: 24, marginBottom: 4 },
    link: { fontSize: 15, color: t.link },
    card: { backgroundColor: t.card, borderRadius: 14, padding: 12, marginBottom: 10 },
    cardRow: { flexDirection: "row", alignItems: "center" },
    figures: { flexDirection: "row", marginRight: 12 },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: "600", color: t.text, marginBottom: 2 },
    muted: { fontSize: 13, color: t.textMuted, marginTop: 2 },
    cardButtons: { flexDirection: "row", gap: 10, marginTop: 10 },
    smallButton: { borderRadius: 10, borderWidth: 1, borderColor: t.border, paddingVertical: 8, paddingHorizontal: 16 },
    smallButtonMain: { backgroundColor: t.primary, borderColor: t.primary },
    smallButtonText: { fontSize: 14, fontWeight: "600", color: t.text },
    smallButtonMainText: { fontSize: 14, fontWeight: "600", color: t.onPrimary },
    historyRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.separator },
    historyName: { fontSize: 15, color: t.text },
    tips: { marginTop: 28 },
    disclaimer: { fontSize: 12, color: t.textMuted, marginTop: 10 },
  });
