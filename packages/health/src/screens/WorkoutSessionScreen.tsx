import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { PrimaryButton, TextField, describeError, useAsyncData, useThemedStyles, type Theme } from "@ecosystem/core";
import { getExercise } from "../lib/exercises";
import { MUSCLES } from "../lib/muscles";
import { formatWeightKg, parseWeightKg } from "../lib/training";
import { addSet, discardWorkout, finishWorkout, getWorkout, updateSet, type WorkoutSet } from "../lib/workouts";

type SetValues = { weightGrams: number | null; reps: number | null };
type SetFlush = () => Promise<void>;

/** The typed weight and repetitions, or a message if one isn't a number. */
function parseSet(weightText: string, repsText: string, usesWeight: boolean): SetValues | { error: string } {
  const weightGrams = usesWeight ? parseWeightKg(weightText) : null;
  const reps = repsText.trim() === "" ? null : Number(repsText);
  if (weightGrams === undefined) return { error: "Вес: число, например 22,5" };
  if (reps !== null && (!Number.isInteger(reps) || reps < 0 || reps > 999)) return { error: "Повторы: целое число" };
  return { weightGrams, reps };
}

/**
 * One set: weight (unless body weight only), repetitions or seconds, and the «done» tick. Saved when a
 * field loses focus; a button press may not take the focus away (Android), so typed values not saved
 * yet are also saved before the workout is finished and when the screen closes (`register`).
 */
function SetRow({
  set,
  number,
  onChanged,
  register,
}: {
  set: WorkoutSet;
  number: number;
  onChanged: () => void;
  register: (setId: number, flush: SetFlush | null) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const exercise = getExercise(set.exerciseId);
  const usesWeight = exercise?.equipment !== "bodyweight";
  const [weightText, setWeightText] = useState(formatWeightKg(set.weightGrams));
  const [repsText, setRepsText] = useState(set.reps === null ? "" : String(set.reps));
  const [done, setDone] = useState(set.done);
  const [error, setError] = useState<string | null>(null);
  // What was typed since the last save; kept outside state so a save on closing sees it.
  const typed = useRef<{ weight: string; reps: string } | null>(null);

  const flush = useCallback(async () => {
    if (!typed.current) return;
    const values = parseSet(typed.current.weight, typed.current.reps, usesWeight);
    if ("error" in values) return;
    typed.current = null;
    await updateSet(set.id, values);
  }, [set.id, usesWeight]);

  useEffect(() => {
    register(set.id, flush);
    return () => {
      register(set.id, null);
      flush().catch((e) => console.warn("Saving a set failed:", describeError(e)));
    };
  }, [register, set.id, flush]);

  function edit(field: "weight" | "reps", text: string) {
    if (field === "weight") setWeightText(text);
    else setRepsText(text);
    typed.current = { weight: weightText, reps: repsText, ...typed.current, [field]: text };
  }

  async function save(change: { done?: boolean } = {}) {
    const values = parseSet(weightText, repsText, usesWeight);
    if ("error" in values) {
      setError(values.error);
      return;
    }
    setError(null);
    typed.current = null;
    try {
      await updateSet(set.id, { ...values, ...change });
      if (change.done !== undefined) setDone(change.done);
      onChanged();
    } catch (e) {
      console.warn("Saving a set failed:", describeError(e));
      setError("Не удалось сохранить подход.");
    }
  }

  return (
    <View>
      <View style={styles.setRow}>
        <Text style={styles.setNumber}>{number}</Text>
        {usesWeight && (
          <>
            <TextField
              style={styles.input}
              value={weightText}
              onChangeText={(text) => edit("weight", text)}
              onBlur={() => save()}
              placeholder="кг"
              keyboardType="decimal-pad"
              accessibilityLabel={`Подход ${number}, вес, кг`}
            />
            <Text style={styles.times}>×</Text>
          </>
        )}
        <TextField
          style={styles.input}
          value={repsText}
          onChangeText={(text) => edit("reps", text)}
          onBlur={() => save()}
          placeholder={exercise?.unit === "seconds" ? "сек" : "повт."}
          keyboardType="number-pad"
          accessibilityLabel={`Подход ${number}, ${exercise?.unit === "seconds" ? "секунды" : "повторы"}`}
        />
        <Pressable
          style={[styles.tick, done && styles.tickDone]}
          onPress={() => save({ done: !done })}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={`Подход ${number} сделан`}
          hitSlop={6}
        >
          <Text style={[styles.tickText, done && styles.tickTextDone]}>✓</Text>
        </Pressable>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

/** A workout in progress: exercises in order, their sets, «Завершить» at the end. */
export function WorkoutSessionScreen({ workoutId }: { workoutId: number }) {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { data, refresh } = useAsyncData(() => getWorkout(workoutId), [workoutId]);
  const [doneCount, setDoneCount] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  // Each set's save of values typed but not saved yet, by set id.
  const unsaved = useRef(new Map<number, SetFlush>());
  const register = useCallback((setId: number, flush: SetFlush | null) => {
    if (flush) unsaved.current.set(setId, flush);
    else unsaved.current.delete(setId);
  }, []);

  if (data === undefined) return <View style={styles.container} />;
  if (data === null) return <Text style={[styles.container, styles.missing]}>Тренировка не найдена.</Text>;

  const workout = data;
  // Sets grouped by exercise, in the order the exercises first appear.
  const groups: { exerciseId: string; sets: WorkoutSet[] }[] = [];
  for (const set of workout.sets) {
    const group = groups.find((g) => g.exerciseId === set.exerciseId);
    if (group) group.sets.push(set);
    else groups.push({ exerciseId: set.exerciseId, sets: [set] });
  }
  const finished = workout.finishedAt !== null;

  async function countDone() {
    const fresh = await getWorkout(workoutId);
    setDoneCount(fresh?.sets.filter((s) => s.done).length ?? 0);
  }

  async function handleFinish() {
    try {
      await Promise.all([...unsaved.current.values()].map((flush) => flush()));
      const fresh = await getWorkout(workoutId);
      if (!fresh?.sets.some((s) => s.done)) {
        setMessage("Отметьте галочкой хотя бы один сделанный подход.");
        return;
      }
      await finishWorkout(workoutId);
      router.back();
    } catch (e) {
      console.warn("Finishing a workout failed:", describeError(e));
      setMessage("Не удалось завершить тренировку. Попробуйте ещё раз.");
    }
  }

  async function handleDiscard() {
    if (!confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    try {
      await discardWorkout(workoutId);
      router.back();
    } catch (e) {
      console.warn("Deleting a workout failed:", describeError(e));
      setMessage("Не удалось удалить тренировку. Попробуйте ещё раз.");
    }
  }

  async function handleAddSet(exerciseId: string) {
    try {
      await addSet(workoutId, exerciseId);
      refresh();
    } catch (e) {
      console.warn("Adding a set failed:", describeError(e));
      setMessage("Не удалось добавить подход. Попробуйте ещё раз.");
    }
  }

  const total = workout.sets.length;
  const done = doneCount ?? workout.sets.filter((s) => s.done).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: workout.name }} />
      <Text style={styles.progress}>
        Сделано подходов: {done} из {total}
        {finished ? " · тренировка завершена" : ""}
      </Text>
      {groups.map((group) => {
        const exercise = getExercise(group.exerciseId);
        return (
          <View key={group.exerciseId} style={styles.exercise}>
            <Text style={styles.exerciseName}>{exercise?.name ?? group.exerciseId}</Text>
            {exercise && (
              <Text style={styles.muted}>
                {exercise.primary.map((m) => MUSCLES[m].label).join(", ")} ·{" "}
                {exercise.equipment === "bodyweight" ? "свой вес, " : "кг × "}
                {exercise.unit === "seconds" ? "секунды" : "повторы"}
              </Text>
            )}
            {group.sets.map((set, i) => (
              <SetRow key={set.id} set={set} number={i + 1} onChanged={countDone} register={register} />
            ))}
            {!finished && (
              <Pressable
                onPress={() => handleAddSet(group.exerciseId)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Добавить подход: ${exercise?.name ?? group.exerciseId}`}
              >
                <Text style={styles.link}>+ подход</Text>
              </Pressable>
            )}
          </View>
        );
      })}
      {message && <Text style={styles.error}>{message}</Text>}
      {!finished && (
        <>
          <PrimaryButton label="Завершить тренировку" onPress={handleFinish} style={styles.finish} />
          <Pressable onPress={handleDiscard} style={styles.discard} accessibilityRole="button">
            <Text style={styles.discardText}>{confirmDiscard ? "Точно удалить? Нажмите ещё раз" : "Удалить тренировку"}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { padding: 20, paddingBottom: 60 },
    missing: { padding: 20, color: t.text },
    progress: { fontSize: 14, color: t.textMuted },
    exercise: { marginTop: 22 },
    exerciseName: { fontSize: 17, fontWeight: "600", color: t.text },
    muted: { fontSize: 13, color: t.textMuted, marginTop: 2, marginBottom: 6 },
    setRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
    setNumber: { width: 18, fontSize: 15, color: t.textMuted, textAlign: "center" },
    // minWidth 0: on the web a text input won't shrink below its natural width otherwise.
    input: { flex: 1, minWidth: 0, textAlign: "center" },
    times: { fontSize: 15, color: t.textMuted },
    tick: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: t.border,
      alignItems: "center",
      justifyContent: "center",
    },
    tickDone: { backgroundColor: t.income, borderColor: t.income },
    tickText: { fontSize: 18, color: t.textMuted, fontWeight: "700" },
    tickTextDone: { color: t.background },
    link: { fontSize: 15, color: t.link, marginTop: 10 },
    error: { color: t.danger, fontSize: 14, marginTop: 8 },
    finish: { marginTop: 32 },
    discard: { alignSelf: "center", marginTop: 16, padding: 8 },
    discardText: { fontSize: 15, color: t.danger },
  });
