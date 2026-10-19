import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Chip, PrimaryButton, TextField, useThemedStyles, type Theme } from "@ecosystem/core";
import { useRouter } from "expo-router";
import { getHealthProfile, saveHealthProfile, type Sex } from "../lib/profile";

const SEX_OPTIONS: { value: Sex | null; label: string }[] = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
  { value: null, label: "Не указывать" },
];

export function HealthProfileScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  // Read once: the stored profile is only the starting value of the form.
  const [initial] = useState(getHealthProfile);
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
      <TextField
        placeholder="Например, 180"
        keyboardType="decimal-pad"
        value={heightText}
        onChangeText={setHeightText}
        accessibilityLabel="Рост, см"
      />
      <Text style={styles.label}>Пол</Text>
      <View style={styles.chipRow}>
        {SEX_OPTIONS.map((o) => (
          <Chip key={o.label} label={o.label} selected={sex === o.value} onPress={() => setSex(o.value)} />
        ))}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton label="Сохранить" onPress={handleSave} style={styles.saveButton} />
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { padding: 20, paddingBottom: 40 },
    hint: { fontSize: 14, color: t.textMuted, marginBottom: 8 },
    label: { fontSize: 14, fontWeight: "600", color: t.text, marginTop: 16, marginBottom: 8 },
    chipRow: { flexDirection: "row", flexWrap: "wrap" },
    error: { color: t.danger, fontSize: 14, marginTop: 12 },
    saveButton: { marginTop: 28 },
  });
