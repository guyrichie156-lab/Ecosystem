import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db, migrations } from "@ecosystem/db";
import { ensureNotificationPermission, seedDefaultCategoriesIfEmpty } from "@ecosystem/finance";

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (!success) return;
    seedDefaultCategoriesIfEmpty();
    ensureNotificationPermission();
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
