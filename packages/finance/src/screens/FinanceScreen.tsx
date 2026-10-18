import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import { SegmentedControl, useThemedStyles, type Theme } from "@ecosystem/core";
import { monthOf, type Month } from "../lib/period";
import { ChartsTab } from "../components/ChartsTab";
import { RecordsTab } from "../components/RecordsTab";
import { ReportsTab } from "../components/ReportsTab";

type Tab = "records" | "charts" | "reports";

/**
 * «Финансы» like the user's own finance app: «Записи / Графики / Отчёты» on top (the bottom bar
 * switches modules) and a floating «+». «Записи» and «Графики» share the month.
 */
export function FinanceScreen() {
  const styles = useThemedStyles(makeStyles);
  const [tab, setTab] = useState<Tab>("records");
  const [month, setMonth] = useState<Month>(() => monthOf(new Date()));

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/finance/budgets" asChild>
              <Pressable hitSlop={10} accessibilityRole="link" style={styles.headerButton}>
                <Text style={styles.headerLink}>Бюджеты</Text>
              </Pressable>
            </Link>
          ),
        }}
      />
      <View style={styles.tabs}>
        <SegmentedControl
          options={[
            { value: "records", label: "Записи" },
            { value: "charts", label: "Графики" },
            { value: "reports", label: "Отчёты" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      {/* Only the open tab is mounted, so a tab reads the database when it is shown. */}
      {tab === "records" && <RecordsTab month={month} onMonthChange={setMonth} />}
      {tab === "charts" && <ChartsTab month={month} onMonthChange={setMonth} />}
      {tab === "reports" && <ReportsTab />}
      <Link href="/finance/add-transaction" asChild>
        <Pressable style={styles.fab} accessibilityRole="button" accessibilityLabel="Новая запись">
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    tabs: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    headerButton: { paddingHorizontal: 16 },
    headerLink: { fontSize: 16, color: t.link },
    fab: {
      position: "absolute",
      right: 20,
      bottom: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: t.accent,
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    },
    fabText: { fontSize: 34, lineHeight: 38, color: t.onAccent, fontWeight: "400" },
  });
