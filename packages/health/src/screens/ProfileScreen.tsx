import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { getProfile, saveProfile, type Sex } from "@ecosystem/db";
import { Chip, PrimaryButton, TextField, useAsyncData, useRefreshOnFocus, useThemedStyles, type Theme } from "@ecosystem/core";
import { HealthConnectCard } from "../components/HealthConnectCard";
import { formatChange, formatMeasurement } from "../lib/kinds";
import { getLatestMeasurements } from "../lib/measurements";

const dayFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

const SEX_OPTIONS: { value: Sex | null; label: string }[] = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
  { value: null, label: "Не указывать" },
];

/** Height in centimetres -> millimetres; null if empty; undefined if out of 100–250 cm. */
function parseHeight(text: string): number | null | undefined {
  const normalized = text.replace(",", ".").trim();
  if (!normalized) return null;
  const cm = Number(normalized);
  if (!/^\d+(\.\d)?$/.test(normalized) || cm < 100 || cm > 250) return undefined;
  return Math.round(cm * 10);
}

/** Year of birth; null if empty; undefined if the age would be under 10 or over 100. */
function parseBirthYear(text: string, thisYear: number): number | null | undefined {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const year = Number(trimmed);
  if (!/^\d{4}$/.test(trimmed) || year > thisYear - 10 || year < thisYear - 100) return undefined;
  return year;
}

/**
 * «Профиль» (FitAI's «Аккаунт», without signing in): weight, height, sex and year of birth.
 * The calorie norm in «Еда» uses the same profile. Everything stays on this phone.
 */
export function ProfileScreen() {
  const styles = useThemedStyles(makeStyles);
  const { data: latest, refresh } = useAsyncData(getLatestMeasurements, []);
  useRefreshOnFocus(refresh);
  const weight = latest?.find((m) => m.kind === "weight");

  // Read once: the stored profile is only the starting value of the form.
  const [initial] = useState(getProfile);
  const [thisYear] = useState(() => new Date().getFullYear());
  const [heightText, setHeightText] = useState(initial.heightMm ? String(initial.heightMm / 10) : "");
  const [sex, setSex] = useState<Sex | null>(initial.sex);
  const [birthYearText, setBirthYearText] = useState(initial.birthYear ? String(initial.birthYear) : "");
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  function handleSave() {
    const heightMm = parseHeight(heightText);
    if (heightMm === undefined) {
      setMessage({ error: true, text: "Рост: от 100 до 250 см" });
      return;
    }
    const birthYear = parseBirthYear(birthYearText, thisYear);
    if (birthYear === undefined) {
      setMessage({ error: true, text: `Год рождения: от ${thisYear - 100} до ${thisYear - 10}` });
      return;
    }
    saveProfile({ heightMm, sex, birthYear });
    setMessage({ error: false, text: "Сохранено" });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.weightCard}>
        <Text style={styles.cardLabel}>Вес</Text>
        <Text style={styles.weight}>{weight ? formatMeasurement("weight", weight.value) : "—"}</Text>
        {weight && (
          <Text style={styles.muted}>
            {dayFormat.format(new Date(weight.measuredAt))}
            {weight.previous !== null ? ` · ${formatChange("weight", weight.value - weight.previous)} с прошлого раза` : ""}
          </Text>
        )}
        <View style={styles.weightButtons}>
          <Link href="/health/add" asChild>
            <Pressable style={styles.smallButtonMain} accessibilityRole="button">
              <Text style={styles.smallButtonMainText}>+ Взвешивание</Text>
            </Pressable>
          </Link>
          {weight && (
            <Link href="/health/weight" asChild>
              <Pressable style={styles.smallButton} accessibilityRole="button">
                <Text style={styles.smallButtonText}>График</Text>
              </Pressable>
            </Link>
          )}
        </View>
      </View>

      <Text style={styles.label}>Рост, см</Text>
      <TextField placeholder="Например, 180" keyboardType="decimal-pad" value={heightText} onChangeText={setHeightText} accessibilityLabel="Рост, см" />
      <Text style={styles.label}>Пол</Text>
      <View style={styles.chipRow}>
        {SEX_OPTIONS.map((o) => (
          <Chip key={o.label} label={o.label} selected={sex === o.value} onPress={() => setSex(o.value)} />
        ))}
      </View>
      <Text style={styles.label}>Год рождения</Text>
      <TextField placeholder="Например, 1995" keyboardType="number-pad" value={birthYearText} onChangeText={setBirthYearText} accessibilityLabel="Год рождения" />
      <Text style={styles.hint}>Рост, пол, возраст и вес нужны для нормы калорий во вкладке «Еда». Хранятся только на этом телефоне.</Text>
      {message && <Text style={message.error ? styles.error : styles.saved}>{message.text}</Text>}
      <PrimaryButton label="Сохранить" onPress={handleSave} style={styles.save} />

      <View style={styles.healthConnect}>
        <HealthConnectCard onImported={refresh} />
      </View>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { padding: 20, paddingBottom: 40 },
    weightCard: { backgroundColor: t.card, borderRadius: 14, padding: 14 },
    cardLabel: { fontSize: 13, color: t.textMuted },
    weight: { fontSize: 28, fontWeight: "700", color: t.text, marginTop: 2 },
    muted: { fontSize: 13, color: t.textMuted, marginTop: 2 },
    weightButtons: { flexDirection: "row", gap: 10, marginTop: 12 },
    smallButton: { borderRadius: 10, borderWidth: 1, borderColor: t.border, paddingVertical: 8, paddingHorizontal: 16 },
    // One style object, not an array: expo-router's <Link asChild> doesn't accept style arrays.
    smallButtonMain: {
      borderRadius: 10,
      borderWidth: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: t.primary,
      borderColor: t.primary,
    },
    smallButtonText: { fontSize: 14, fontWeight: "600", color: t.text },
    smallButtonMainText: { fontSize: 14, fontWeight: "600", color: t.onPrimary },
    label: { fontSize: 14, fontWeight: "600", color: t.text, marginTop: 18, marginBottom: 8 },
    chipRow: { flexDirection: "row", flexWrap: "wrap" },
    hint: { fontSize: 13, color: t.textMuted, marginTop: 14 },
    error: { color: t.danger, fontSize: 14, marginTop: 12 },
    saved: { color: t.income, fontSize: 14, marginTop: 12 },
    save: { marginTop: 16 },
    healthConnect: { marginTop: 28 },
  });
