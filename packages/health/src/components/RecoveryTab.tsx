import React, { useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Chip,
  PrimaryButton,
  describeError,
  useAsyncData,
  useRefreshOnFocus,
  useThemedStyles,
  type Theme,
} from "@ecosystem/core";
import { getExercise } from "../lib/exercises";
import { MUSCLES } from "../lib/muscles";
import { TIP_SOURCES } from "../lib/tips";
import { RECOVERY_HOURS, muscleRecovery, restedWorkoutExercises, type MuscleRecovery } from "../lib/training";
import { getExercisesLastDone, startWorkout } from "../lib/workouts";
import { BodyMap, type MuscleHighlight } from "./BodyMap";

const dayFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

/** Muscles still resting are coloured: brighter in the first 24 hours. */
function restingHighlights(recovery: MuscleRecovery[]): MuscleHighlight[] {
  return recovery
    .filter((r) => !r.ready)
    .map((r) => ({ muscle: r.muscle, level: r.hoursLeft > RECOVERY_HOURS / 2 ? 2 : 1 }));
}

/** «Восстановление»: which muscle groups have had 48 hours since their last workout. */
export function RecoveryTab() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [side, setSide] = useState<"front" | "back">("front");
  const [startError, setStartError] = useState<string | null>(null);
  const { data, refreshing, refresh, pullToRefresh } = useAsyncData(async () => {
    const lastDone = await getExercisesLastDone();
    return muscleRecovery(lastDone, Date.now());
  }, []);
  useRefreshOnFocus(refresh);

  const recovery = data ?? [];
  const rested = restedWorkoutExercises(recovery);
  const readyCount = recovery.filter((r) => r.ready).length;

  async function startRested() {
    setStartError(null);
    try {
      const id = await startWorkout({
        name: "На отдохнувшие мышцы",
        exercises: rested.map((exerciseId) => ({
          exerciseId,
          sets: 3,
          reps: getExercise(exerciseId)?.unit === "seconds" ? 30 : 10,
        })),
      });
      router.push(`/health/workout/${id}`);
    } catch (e) {
      console.warn("Starting a workout failed:", describeError(e));
      setStartError("Не удалось начать тренировку. Попробуйте ещё раз.");
    }
  }

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={pullToRefresh} />}
    >
      <View style={styles.sides}>
        <Chip label="Спереди" selected={side === "front"} onPress={() => setSide("front")} />
        <Chip label="Сзади" selected={side === "back"} onPress={() => setSide("back")} />
      </View>
      <View style={styles.figure}>
        <BodyMap highlights={restingHighlights(recovery)} side={side} scale={0.9} />
      </View>
      {data && (
        <Text style={styles.summary}>
          Отдохнули {readyCount} из {recovery.length} групп мышц. Цветом — те, что ещё отдыхают.
        </Text>
      )}
      <PrimaryButton
        label="Тренировка на отдохнувшие мышцы"
        onPress={startRested}
        disabled={rested.length === 0}
        style={styles.startButton}
      />
      {data && rested.length === 0 && <Text style={styles.muted}>Все основные мышцы ещё отдыхают.</Text>}
      {startError && <Text style={styles.error}>{startError}</Text>}

      {recovery.map((r) => {
        const rest = r.lastTrainedAt === null ? 1 : (RECOVERY_HOURS - r.hoursLeft) / RECOVERY_HOURS;
        return (
          <View key={r.muscle} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.muscle}>{MUSCLES[r.muscle].label}</Text>
              <Text style={r.ready ? styles.ready : styles.resting}>{r.ready ? "готова" : `ещё ${r.hoursLeft} ч`}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(rest * 100)}%` }]} />
            </View>
            <Text style={styles.muted}>
              {r.lastTrainedAt === null ? "Ещё не тренировали" : `Тренировали ${dayFormat.format(new Date(r.lastTrainedAt))}`}
            </Text>
          </View>
        );
      })}

      <Text style={styles.note}>
        Это не измерение мышц, а время с прошлой тренировки. Мышца считается отдохнувшей через {RECOVERY_HOURS} часов
        после тренировки, где она основная: ACSM советует не меньше 48 часов между силовыми тренировками одной группы
        мышц. Часть исследователей считает, что полные 48 часов нужны не всегда.
      </Text>
      <Pressable onPress={() => Linking.openURL(TIP_SOURCES.acsmRest.url)} accessibilityRole="link" hitSlop={8}>
        <Text style={styles.source}>Источник: {TIP_SOURCES.acsmRest.label} ↗</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    list: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    sides: { flexDirection: "row", justifyContent: "center", marginTop: 4 },
    figure: { alignItems: "center", marginTop: 4 },
    summary: { fontSize: 14, color: t.textSecondary, textAlign: "center", marginTop: 8 },
    startButton: { marginTop: 14, marginBottom: 8 },
    error: { color: t.danger, fontSize: 14, marginBottom: 8 },
    row: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.separator },
    rowHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    muscle: { fontSize: 15, color: t.text },
    ready: { fontSize: 14, fontWeight: "600", color: t.income },
    resting: { fontSize: 14, fontWeight: "600", color: t.text },
    track: { height: 6, borderRadius: 3, backgroundColor: t.fill, overflow: "hidden" },
    fill: { height: "100%", backgroundColor: t.chart.slots[0] },
    muted: { fontSize: 12, color: t.textMuted, marginTop: 4 },
    note: { fontSize: 13, color: t.textMuted, marginTop: 16, lineHeight: 19 },
    source: { fontSize: 12, color: t.link, marginTop: 8 },
  });
