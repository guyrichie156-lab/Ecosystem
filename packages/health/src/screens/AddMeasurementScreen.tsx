import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TextField } from "@ecosystem/core";
import { useRouter } from "expo-router";
import { ACTIVE_KINDS, KIND_INFO, labelWithUnit, parseMeasurement, type BodyMeasurementKind } from "../lib/kinds";
import { addCheckIn } from "../lib/measurements";

export function AddMeasurementScreen() {
  const router = useRouter();
  const [inputs, setInputs] = useState<Partial<Record<BodyMeasurementKind, string>>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const values: Partial<Record<BodyMeasurementKind, number>> = {};
    const problems: string[] = [];
    for (const kind of ACTIVE_KINDS) {
      const text = inputs[kind]?.trim();
      if (!text) continue;
      const result = parseMeasurement(kind, text);
      if ("error" in result) problems.push(result.error);
      else values[kind] = result.value;
    }
    if (problems.length === 0 && Object.keys(values).length === 0) {
      problems.push("Заполните хотя бы одно поле.");
    }
    setErrors(problems);
    if (problems.length > 0) return;

    setSaving(true);
    try {
      await addCheckIn(values);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.hint}>Заполните только то, что измерили. Дробная часть — через запятую.</Text>
      {ACTIVE_KINDS.map((kind) => (
        <View key={kind} style={styles.field}>
          <Text style={styles.label}>{labelWithUnit(kind)}</Text>
          <TextField
            placeholder={KIND_INFO[kind].example}
            keyboardType="decimal-pad"
            value={inputs[kind] ?? ""}
            onChangeText={(text) => setInputs((prev) => ({ ...prev, [kind]: text }))}
            accessibilityLabel={labelWithUnit(kind)}
          />
        </View>
      ))}
      {errors.map((e) => (
        <Text key={e} style={styles.error}>
          {e}
        </Text>
      ))}
      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? "Сохранение…" : "Сохранить"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 20, paddingBottom: 40 },
  hint: { fontSize: 14, color: "#8a8a8e", marginBottom: 12 },
  field: { marginTop: 14 },
  label: { fontSize: 15, fontWeight: "600", color: "#1c1c1e", marginBottom: 6 },
  error: { color: "#c62828", fontSize: 14, marginTop: 12 },
  saveButton: {
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 28,
  },
  saveButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
});
