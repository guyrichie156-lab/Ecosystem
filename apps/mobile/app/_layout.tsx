import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme, type Theme } from "@ecosystem/core";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db, migrations } from "@ecosystem/db";
import { appModules } from "../modules";

/** Runs one start-up step of every module; one module failing must not block the others. */
async function runForEachModule(step: "prepare" | "onReady") {
  await Promise.all(
    appModules.map(async (module) => {
      try {
        await module[step]?.();
      } catch (e) {
        console.error(`Module "${module.id}" failed in ${step}`, e);
      }
    })
  );
}

/** Headers and the tab bar take their colours from the navigation theme. */
function navigationTheme(t: Theme) {
  const base = t.dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: { ...base.colors, primary: t.link, background: t.background, card: t.background, text: t.text, border: t.separator, notification: t.danger },
  };
}

export default function RootLayout() {
  const theme = useTheme();
  const navTheme = useMemo(() => navigationTheme(theme), [theme]);
  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="auto" />
      <AppContent theme={theme} />
    </ThemeProvider>
  );
}

function AppContent({ theme }: { theme: Theme }) {
  const { success, error } = useMigrations(db, migrations);
  const [prepared, setPrepared] = useState(false);

  useEffect(() => {
    if (!success) return;
    // Screens appear only after every module has its data ready; background work follows.
    runForEachModule("prepare").then(() => {
      setPrepared(true);
      runForEachModule("onReady");
    });
  }, [success]);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Ошибка миграции базы данных: {error.message}</Text>
      </View>
    );
  }

  if (!success || !prepared) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.textMuted} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
});
