import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { BODY_MEASUREMENT_KINDS, KIND_INFO, parseMeasurement, type BodyMeasurementKind } from "../lib/kinds";
import { addCheckIn } from "../lib/measurements";

export function AddMeasurementScreen() {
  const router = useRouter();
  const [inputs, setInputs] = useState<Partial<Record<BodyMeasurementKind, string>>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const values: Partial<Record<BodyMeasurementKind, number>> = {};
    const problems: string[] = [];
    for (const kind of BODY_MEASUREMENT_KINDS) {
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
      {BODY_MEASUREMENT_KINDS.map((kind) => (
        <View key={kind} style={styles.row}>
          <Text style={styles.label}>{KIND_INFO[kind].label}</Text>
          <TextInput
            style={styles.input}
            placeholder={KIND_INFO[kind].unit}
            keyboardType="decimal-pad"
            value={inputs[kind] ?? ""}
            onChangeText={(text) => setInputs((prev) => ({ ...prev, [kind]: text }))}
            accessibilityLabel={`${KIND_INFO[kind].label}, ${KIND_INFO[kind].unit}`}
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
  row: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  label: { flex: 1, fontSize: 16, color: "#1c1c1e" },
  input: {
    width: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d1d6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1c1c1e",
    textAlign: "right",
  },
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
