import React, { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { getLatestWeightGrams, getProfile, saveProfile, saveWeighIn, type Sex } from "@ecosystem/db";
import { Chip, PrimaryButton, TextField, describeError, useAsyncData, useThemedStyles, type Theme } from "@ecosystem/core";
import { getActivityLevel, getManualGoal, saveActivityLevel, saveManualGoal } from "../lib/norm";
import { ACTIVITY_LEVELS, activityFactor, formatKcal, parseAmount, restingKcal, type ActivityLevel } from "../lib/nutrition";

const SOURCES = {
  mifflin: { label: "Mifflin и др., Am J Clin Nutr, 1990", url: "https://pubmed.ncbi.nlm.nih.gov/2305711/" },
  fao: { label: "FAO/WHO/UNU: Human energy requirements, 2004", url: "https://www.fao.org/4/y5686e/y5686e00.htm" },
};

const number = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

function Form({ initialWeightGrams }: { initialWeightGrams: number | null }) {
  const styles = useThemedStyles(makeStyles);
  const [initial] = useState(getProfile);
  const [thisYear] = useState(() => new Date().getFullYear());
  const [weightText, setWeightText] = useState(initialWeightGrams ? number.format(initialWeightGrams / 1000) : "");
  const [heightText, setHeightText] = useState(initial.heightMm ? String(initial.heightMm / 10) : "");
  const [sex, setSex] = useState<Sex | null>(initial.sex);
  const [birthYearText, setBirthYearText] = useState(initial.birthYear ? String(initial.birthYear) : "");
  const [level, setLevel] = useState<ActivityLevel>(getActivityLevel);
  const [manualText, setManualText] = useState(() => String(getManualGoal() ?? ""));
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  const weightGrams = parseAmount(weightText, 400, 1000);
  const heightMm = parseAmount(heightText, 250, 10);
  const birthYear = parseAmount(birthYearText, thisYear - 10);
  const age = typeof birthYear === "number" && birthYear >= thisYear - 100 ? thisYear - birthYear : null;
  const ready = typeof weightGrams === "number" && weightGrams >= 20000 && typeof heightMm === "number" && heightMm >= 1000 && sex && age;
  const inputs = ready ? { weightKg: weightGrams / 1000, heightCm: heightMm / 10, age, sex } : null;
  const resting = inputs ? restingKcal(inputs) : null;
  const factor = activityFactor(level);
  const formula = resting === null ? null : Math.round(resting * factor);

  function handleSave() {
    const manual = parseAmount(manualText, 10000);
    if (manual === undefined || (manual !== null && manual < 500)) {
      setMessage({ error: true, text: "Своя норма: число от 500 до 10 000 ккал, или оставьте пустым." });
      return;
    }
    if (weightText.trim() && (typeof weightGrams !== "number" || weightGrams < 20000)) {
      setMessage({ error: true, text: "Вес: от 20 до 400 кг." });
      return;
    }
    if (heightText.trim() && (typeof heightMm !== "number" || heightMm < 1000)) {
      setMessage({ error: true, text: "Рост: от 100 до 250 см." });
      return;
    }
    if (birthYearText.trim() && age === null) {
      setMessage({ error: true, text: `Год рождения: от ${thisYear - 100} до ${thisYear - 10}.` });
      return;
    }
    try {
      saveProfile({
        heightMm: typeof heightMm === "number" ? heightMm : null,
        sex,
        birthYear: age === null ? null : (birthYear as number),
      });
      if (typeof weightGrams === "number" && weightGrams !== initialWeightGrams) void saveWeighIn(weightGrams);
      saveActivityLevel(level);
      saveManualGoal(manual);
      setMessage({ error: false, text: "Сохранено" });
    } catch (e) {
      console.warn("Saving the norm failed:", describeError(e));
      setMessage({ error: true, text: "Не удалось сохранить. Попробуйте ещё раз." });
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.hint}>
        Норма считается по формуле Миффлина — Сан Жеора: это оценка, а не медицинская рекомендация. Вес, рост, пол и год
        рождения общие с профилем во вкладке «Здоровье» и хранятся только на телефоне.
      </Text>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.label}>Вес, кг</Text>
          <TextField value={weightText} onChangeText={setWeightText} keyboardType="decimal-pad" placeholder="82,5" accessibilityLabel="Вес, кг" />
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Рост, см</Text>
          <TextField value={heightText} onChangeText={setHeightText} keyboardType="decimal-pad" placeholder="180" accessibilityLabel="Рост, см" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.label}>Год рождения</Text>
          <TextField value={birthYearText} onChangeText={setBirthYearText} keyboardType="number-pad" placeholder="1995" accessibilityLabel="Год рождения" />
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Пол</Text>
          <View style={styles.chips}>
            <Chip label="Мужской" selected={sex === "male"} onPress={() => setSex("male")} />
            <Chip label="Женский" selected={sex === "female"} onPress={() => setSex("female")} />
          </View>
        </View>
      </View>

      <Text style={styles.label}>Активность</Text>
      {ACTIVITY_LEVELS.map((l) => (
        <Pressable
          key={l.id}
          style={[styles.level, level === l.id && styles.levelSelected]}
          onPress={() => setLevel(l.id)}
          accessibilityRole="radio"
          accessibilityState={{ checked: level === l.id }}
        >
          <Text style={styles.levelTitle}>{l.label}</Text>
          <Text style={styles.muted}>
            Коэффициент {l.band}, в расчёте — {number.format(l.factor)}
          </Text>
        </Pressable>
      ))}

      <View style={styles.calc}>
        {inputs && resting !== null && formula !== null ? (
          <>
            <Text style={styles.calcLine}>
              В покое: 10 × {number.format(inputs.weightKg)} + 6,25 × {number.format(inputs.heightCm)} − 5 × {inputs.age}{" "}
              {inputs.sex === "male" ? "+ 5" : "− 161"} = {formatKcal(Math.round(resting))} ккал
            </Text>
            <Text style={styles.calcLine}>
              За день: {formatKcal(Math.round(resting))} × {number.format(factor)} = {formatKcal(formula)} ккал
            </Text>
          </>
        ) : (
          <Text style={styles.calcLine}>Заполните вес, рост, пол и год рождения — здесь появится расчёт.</Text>
        )}
        <Text style={styles.muted}>Возраст считается по году рождения, поэтому может быть на год больше настоящего.</Text>
      </View>

      <Text style={styles.label}>Своя норма, ккал (необязательно)</Text>
      <TextField
        value={manualText}
        onChangeText={setManualText}
        keyboardType="number-pad"
        placeholder={formula ? `По формуле: ${formula}` : "Например, 2200"}
        accessibilityLabel="Своя норма, ккал"
      />
      <Text style={styles.muted}>Если заполнено, используется вместо формулы.</Text>

      {message && <Text style={message.error ? styles.error : styles.saved}>{message.text}</Text>}
      <PrimaryButton label="Сохранить" onPress={handleSave} style={styles.save} />

      <Text style={styles.sourcesTitle}>Источники</Text>
      {Object.values(SOURCES).map((s) => (
        <Pressable key={s.url} onPress={() => Linking.openURL(s.url)} accessibilityRole="link" hitSlop={6}>
          <Text style={styles.source}>{s.label} ↗</Text>
        </Pressable>
      ))}
      <Text style={styles.muted}>
        Диапазоны коэффициентов взяты из пересказа доклада FAO/WHO/UNU (Википедия, черновик 2001 года): сам доклад из
        облака не открылся. В расчёте — середина диапазона.
      </Text>
    </ScrollView>
  );
}

/** The daily calorie norm: the formula with every step shown, the inputs, and a norm of one's own. */
export function NormScreen() {
  const styles = useThemedStyles(makeStyles);
  const { data: weight } = useAsyncData(getLatestWeightGrams, []);
  if (weight === undefined) return <View style={styles.container} />;
  return <Form initialWeightGrams={weight} />;
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { padding: 20, paddingBottom: 40 },
    hint: { fontSize: 13, color: t.textMuted, lineHeight: 19 },
    row: { flexDirection: "row", gap: 12 },
    cell: { flex: 1 },
    label: { fontSize: 14, fontWeight: "600", color: t.text, marginTop: 16, marginBottom: 8 },
    chips: { flexDirection: "row", flexWrap: "wrap" },
    level: { borderRadius: 12, borderWidth: 1, borderColor: t.separator, padding: 12, marginBottom: 8 },
    levelSelected: { borderColor: t.link, borderWidth: 2 },
    levelTitle: { fontSize: 15, color: t.text },
    muted: { fontSize: 12, color: t.textMuted, marginTop: 4 },
    calc: { backgroundColor: t.card, borderRadius: 12, padding: 14, marginTop: 12 },
    calcLine: { fontSize: 15, color: t.text, marginBottom: 4, lineHeight: 21 },
    error: { color: t.danger, fontSize: 14, marginTop: 12 },
    saved: { color: t.income, fontSize: 14, marginTop: 12 },
    save: { marginTop: 18 },
    sourcesTitle: { fontSize: 14, fontWeight: "600", color: t.text, marginTop: 26 },
    source: { fontSize: 13, color: t.link, marginTop: 6 },
  });
