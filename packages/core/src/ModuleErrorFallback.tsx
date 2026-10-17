import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ErrorBoundaryProps } from "expo-router";
import type { AppModule } from "./types";

/**
 * Re-export from a module's root `_layout.tsx` as `ErrorBoundary`: a crash inside the module
 * replaces only that module's screens, the rest of the app keeps working.
 */
export function ModuleErrorFallback({ module, error, retry }: ErrorBoundaryProps & { module: AppModule }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>
        {module.icon} {module.title}
      </Text>
      <Text style={styles.text}>В модуле произошла ошибка. Остальное приложение работает.</Text>
      <Text style={styles.error} numberOfLines={4}>
        {error.message}
      </Text>
      <Pressable style={styles.button} onPress={retry}>
        <Text style={styles.buttonText}>Перезапустить модуль</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#1c1c1e" },
  text: { fontSize: 16, color: "#3a3a3c", textAlign: "center", marginBottom: 12 },
  error: { fontSize: 13, color: "#8e8e93", textAlign: "center", marginBottom: 20 },
  button: {
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 240,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
