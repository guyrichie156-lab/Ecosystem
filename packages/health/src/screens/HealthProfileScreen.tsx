import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { getHealthProfile, saveHealthProfile, type Sex } from "../lib/profile";

const SEX_OPTIONS: { value: Sex | null; label: string }[] = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
  { value: null, label: "Не указывать" },
];

export function HealthProfileScreen() {
  const router = useRouter();
  const initial = getHealthProfile();
  const [heightText, setHeightText] = useState(initial.heightMm ? String(initial.heightMm / 10) : "");
  const [sex, setSex] = useState<Sex | null>(initial.sex);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const normalized = heightText.replace(",", ".").trim();
    let heightMm: number | null = null;
    if (normalized) {
      const cm = Number(normalized);
      if (!/^\d+(\.\d)?$/.test(normalized) || cm < 100 || cm > 250) {
        setError("Рост: от 100 до 250 см");
        return;
      }
      heightMm = Math.round(cm * 10);
    }
    saveHealthProfile({ heightMm, sex });
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.hint}>
        Рост нужен для отношения талии к росту, пол — для ориентиров по талии. Хранится только на этом устройстве.
      </Text>
      <Text style={styles.label}>Рост, см</Text>
      <TextInput
        style={styles.input}
        placeholder="Например, 180"
        keyboardType="decimal-pad"
        value={heightText}
        onChangeText={setHeightText}
        accessibilityLabel="Рост, см"
      />
      <Text style={styles.label}>Пол</Text>
      <View style={styles.chipRow}>
        {SEX_OPTIONS.map((o) => (
          <Pressable
            key={o.label}
            style={[styles.chip, sex === o.value && styles.chipSelected]}
            onPress={() => setSex(o.value)}
          >
            <Text style={[styles.chipText, sex === o.value && styles.chipTextSelected]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Сохранить</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 20, paddingBottom: 40 },
  hint: { fontSize: 14, color: "#8a8a8e", marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "600", color: "#1c1c1e", marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d1d6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1c1c1e",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f0f0f2",
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { backgroundColor: "#1c1c1e" },
  chipText: { fontSize: 14, color: "#1c1c1e" },
  chipTextSelected: { color: "#ffffff" },
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
