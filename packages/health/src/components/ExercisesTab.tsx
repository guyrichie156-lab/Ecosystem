import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Chip, TextField, useThemedStyles, type Theme } from "@ecosystem/core";
import { EQUIPMENT_LABELS, filterExercises, type Equipment, type Exercise } from "../lib/exercises";
import { MUSCLES, MUSCLE_IDS, type Muscle } from "../lib/muscles";

const EQUIPMENT_IDS = Object.keys(EQUIPMENT_LABELS) as Equipment[];

/** One line about an exercise: main muscles and equipment. */
export function exerciseCaption(exercise: Exercise): string {
  return `${exercise.primary.map((m) => MUSCLES[m].label).join(", ")} · ${EQUIPMENT_LABELS[exercise.equipment]}`;
}

/** Chips that filter by one value, or by none when the selected chip is tapped again. */
function FilterRow<T extends string>({
  values,
  label,
  selected,
  onSelect,
}: {
  values: T[];
  label: (value: T) => string;
  selected: T | null;
  onSelect: (value: T | null) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} keyboardShouldPersistTaps="handled">
      {values.map((v) => (
        <Chip key={v} label={label(v)} selected={selected === v} onPress={() => onSelect(selected === v ? null : v)} />
      ))}
    </ScrollView>
  );
}

/** «Упражнения»: the catalog with search and filters by main muscle and equipment. */
export function ExercisesTab() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const exercises = useMemo(() => filterExercises({ query, muscle, equipment }), [query, muscle, equipment]);

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={exercises}
      keyExtractor={(e) => e.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <TextField
            placeholder="Найти упражнение"
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Найти упражнение"
            returnKeyType="search"
          />
          <FilterRow values={MUSCLE_IDS} label={(m) => MUSCLES[m].label} selected={muscle} onSelect={setMuscle} />
          <FilterRow values={EQUIPMENT_IDS} label={(e) => EQUIPMENT_LABELS[e]} selected={equipment} onSelect={setEquipment} />
          <Text style={styles.count}>Упражнений: {exercises.length}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/health/exercise/${item.id}`)} accessibilityRole="button">
          <View style={styles.rowText}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.caption}>{exerciseCaption(item)}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Ничего не нашлось. Попробуйте другое слово или снимите фильтры.</Text>}
    />
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    list: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
    filters: { marginTop: 10, flexGrow: 0 },
    count: { fontSize: 13, color: t.textMuted, marginTop: 10, marginBottom: 4 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.separator,
    },
    rowText: { flex: 1 },
    name: { fontSize: 16, color: t.text },
    caption: { fontSize: 13, color: t.textMuted, marginTop: 2 },
    chevron: { fontSize: 22, color: t.textMuted, marginLeft: 8 },
    empty: { fontSize: 15, color: t.textMuted, marginTop: 24, textAlign: "center" },
  });
