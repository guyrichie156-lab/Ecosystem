import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
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

export default function RootLayout() {
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
      <View style={styles.center}>
        <Text>Ошибка миграции базы данных: {error.message}</Text>
      </View>
    );
  }

  if (!success || !prepared) {
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
