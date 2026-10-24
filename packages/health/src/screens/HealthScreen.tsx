import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import { SegmentedControl, SettingsButton, useThemedStyles, type Theme } from "@ecosystem/core";
import { ExercisesTab } from "../components/ExercisesTab";
import { RecoveryTab } from "../components/RecoveryTab";
import { TrainingTab } from "../components/TrainingTab";

type Tab = "training" | "exercises" | "recovery";

/**
 * «Здоровье» like the user's FitAI (2026-10-20): its bottom tabs became a switcher on top, because the
 * app's bottom bar holds the modules. FitAI's «Аккаунт» is «Профиль» behind the 👤 button.
 */
export function HealthScreen() {
  const styles = useThemedStyles(makeStyles);
  const [tab, setTab] = useState<Tab>("training");

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Link href="/health/profile" asChild>
                <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Профиль" style={styles.headerButton}>
                  <Text style={styles.headerIcon}>👤</Text>
                </Pressable>
              </Link>
              <SettingsButton />
            </View>
          ),
        }}
      />
      <View style={styles.tabs}>
        <SegmentedControl
          options={[
            { value: "training", label: "Тренировка" },
            { value: "exercises", label: "Упражнения" },
            // «Восстановление» doesn't fit a third of a phone screen.
            { value: "recovery", label: "Отдых мышц" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      {/* Only the open tab is mounted, so a tab reads the database when it is shown. */}
      {tab === "training" && <TrainingTab />}
      {tab === "exercises" && <ExercisesTab />}
      {tab === "recovery" && <RecoveryTab />}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    tabs: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    headerButtons: { flexDirection: "row", alignItems: "center" },
    headerButton: { paddingHorizontal: 12 },
    headerIcon: { fontSize: 22 },
  });
