import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db, migrations } from "@ecosystem/db";
import { appModules } from "../modules";

/** Start-up work of each module; one module failing must not block the others. */
async function startModules() {
  await Promise.all(
    appModules
      .filter((module) => module.onReady)
      .map(async (module) => {
        try {
          await module.onReady!();
        } catch (e) {
          console.error(`Module "${module.id}" failed to start`, e);
        }
      })
  );
}

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (!success) return;
    startModules();
  }, [success]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Ошибка миграции базы данных: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
});
