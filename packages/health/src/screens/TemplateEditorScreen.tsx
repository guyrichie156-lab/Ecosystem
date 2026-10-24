import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { TextField, describeError, useAsyncData, useThemedStyles, type Theme } from "@ecosystem/core";
import { filterExercises, getExercise } from "../lib/exercises";
import { deleteTemplate, getTemplate, saveTemplate, type TemplateExercise, type WorkoutTemplate } from "../lib/workouts";
import { exerciseCaption } from "../components/ExercisesTab";

type Row = { exerciseId: string; setsText: string; repsText: string };

/** Checks the form; the message is shown under it. */
function checkRows(name: string, rows: Row[]): { ok: true; exercises: TemplateExercise[] } | { ok: false; error: string } {
  if (!name.trim()) return { ok: false, error: "Введите название комплекса." };
  if (rows.length === 0) return { ok: false, error: "Добавьте хотя бы одно упражнение." };
  const exercises: TemplateExercise[] = [];
  for (const row of rows) {
    const sets = Number(row.setsText);
    const reps = Number(row.repsText);
    const label = getExercise(row.exerciseId)?.name ?? row.exerciseId;
    if (!Number.isInteger(sets) || sets < 1 || sets > 10) return { ok: false, error: `${label}: подходов от 1 до 10.` };
    if (!Number.isInteger(reps) || reps < 1 || reps > 600) return { ok: false, error: `${label}: повторов от 1 до 600.` };
    exercises.push({ exerciseId: row.exerciseId, sets, reps });
  }
  return { ok: true, exercises };
}

function Fields({ template }: { template: WorkoutTemplate | null }) {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [name, setName] = useState(template?.name ?? "");
  const [rows, setRows] = useState<Row[]>(
    (template?.exercises ?? []).map((e) => ({ exerciseId: e.exerciseId, setsText: String(e.sets), repsText: String(e.reps) }))
  );
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(template === null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const found = useMemo(() => filterExercises({ query }), [query]);

  const update = (index: number, change: Partial<Row>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...change } : r)));
  const remove = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));
  const moveUp = (index: number) =>
    setRows((prev) => (index === 0 ? prev : [...prev.slice(0, index - 1), prev[index], prev[index - 1], ...prev.slice(index + 1)]));
  const add = (exerciseId: string) => {
    const seconds = getExercise(exerciseId)?.unit === "seconds";
    setRows((prev) => [...prev, { exerciseId, setsText: "3", repsText: seconds ? "30" : "10" }]);
  };

  async function handleSave() {
    const checked = checkRows(name, rows);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await saveTemplate({ id: template?.id, name: name.trim(), exercises: checked.exercises });
      router.back();
    } catch (e) {
      console.warn("Saving a workout template failed:", describeError(e));
      setError("Не удалось сохранить комплекс. Попробуйте ещё раз.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!template) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteTemplate(template.id);
      router.back();
    } catch (e) {
      console.warn("Deleting a workout template failed:", describeError(e));
      setError("Не удалось удалить комплекс.");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* «Сохранить» sits in the header, so it stays in reach while the exercise list below is long. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={handleSave} disabled={saving} hitSlop={10} accessibilityRole="button" style={styles.headerButton}>
              <Text style={styles.headerText}>{saving ? "Сохранение…" : "Сохранить"}</Text>
            </Pressable>
          ),
        }}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.label}>Название</Text>
      <TextField value={name} onChangeText={setName} maxLength={60} placeholder="Например, «Грудь и спина»" accessibilityLabel="Название" />

      <Text style={styles.label}>Упражнения · подходы × повторы</Text>
      {rows.length === 0 && <Text style={styles.muted}>Пока пусто — выберите упражнения ниже.</Text>}
      {rows.map((row, index) => {
        const exercise = getExercise(row.exerciseId);
        return (
          <View key={`${row.exerciseId}-${index}`} style={styles.row}>
            <Text style={styles.rowName} numberOfLines={2}>
              {exercise?.name ?? row.exerciseId}
            </Text>
            <View style={styles.rowControls}>
              <TextField
                style={styles.number}
                value={row.setsText}
                onChangeText={(setsText) => update(index, { setsText })}
                keyboardType="number-pad"
                accessibilityLabel={`Подходов: ${exercise?.name ?? row.exerciseId}`}
              />
              <Text style={styles.muted}>×</Text>
              <TextField
                style={styles.number}
                value={row.repsText}
                onChangeText={(repsText) => update(index, { repsText })}
                keyboardType="number-pad"
                accessibilityLabel={`${exercise?.unit === "seconds" ? "Секунд" : "Повторов"}: ${exercise?.name ?? row.exerciseId}`}
              />
              {exercise?.unit === "seconds" && <Text style={styles.muted}>сек</Text>}
              <Pressable onPress={() => moveUp(index)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Выше: ${exercise?.name ?? row.exerciseId}`}>
                <Text style={styles.icon}>↑</Text>
              </Pressable>
              <Pressable onPress={() => remove(index)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Убрать: ${exercise?.name ?? row.exerciseId}`}>
                <Text style={styles.icon}>✕</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {template && (
        <Pressable onPress={handleDelete} style={styles.delete} accessibilityRole="button">
          <Text style={styles.deleteText}>{confirmDelete ? "Точно удалить? Нажмите ещё раз" : "Удалить комплекс"}</Text>
        </Pressable>
      )}

      {picking ? (
        <View style={styles.picker}>
          <Text style={styles.label}>Добавить упражнение</Text>
          <TextField value={query} onChangeText={setQuery} placeholder="Найти упражнение" accessibilityLabel="Найти упражнение" />
          {found.map((e) => (
            <Pressable key={e.id} style={styles.pickRow} onPress={() => add(e.id)} accessibilityRole="button">
              <View style={styles.pickText}>
                <Text style={styles.pickName}>{e.name}</Text>
                <Text style={styles.muted}>{exerciseCaption(e)}</Text>
              </View>
              <Text style={styles.plus}>+</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Pressable onPress={() => setPicking(true)} style={styles.addButton} accessibilityRole="button">
          <Text style={styles.link}>+ Добавить упражнение</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

/** Creates a workout template («new») or edits one. */
export function TemplateEditorScreen({ templateId }: { templateId: number | null }) {
  const styles = useThemedStyles(makeStyles);
  const { data, loading } = useAsyncData(() => (templateId === null ? Promise.resolve(null) : getTemplate(templateId)), [templateId]);
  if (loading) return <View style={styles.container} />;
  if (templateId !== null && !data) return <Text style={[styles.container, styles.missing]}>Комплекс не найден.</Text>;
  // A new key per template: the form starts from that template's values.
  return <Fields key={templateId ?? "new"} template={data ?? null} />;
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { padding: 20, paddingBottom: 60 },
    missing: { padding: 20, color: t.text },
    label: { fontSize: 14, fontWeight: "600", color: t.text, marginTop: 18, marginBottom: 8 },
    muted: { fontSize: 13, color: t.textMuted },
    row: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.separator },
    rowName: { fontSize: 15, color: t.text, marginBottom: 6 },
    rowControls: { flexDirection: "row", alignItems: "center", gap: 8 },
    number: { width: 64, textAlign: "center" },
    icon: { fontSize: 18, color: t.textMuted, paddingHorizontal: 6 },
    headerButton: { paddingHorizontal: 16 },
    headerText: { fontSize: 16, fontWeight: "600", color: t.link },
    picker: { marginTop: 16 },
    pickRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.separator,
    },
    pickText: { flex: 1 },
    pickName: { fontSize: 15, color: t.text },
    plus: { fontSize: 24, color: t.link, paddingHorizontal: 8 },
    addButton: { marginTop: 14 },
    link: { fontSize: 15, color: t.link },
    error: { color: t.danger, fontSize: 14, marginBottom: 4 },
    delete: { alignSelf: "flex-start", marginTop: 12, paddingVertical: 8 },
    deleteText: { fontSize: 15, color: t.danger },
  });
