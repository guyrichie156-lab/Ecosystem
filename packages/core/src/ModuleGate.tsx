import React, { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ErrorBoundaryProps } from "expo-router";
import { setModuleEnabled, useModuleEnabled } from "./moduleFlags";
import type { AppModule } from "./types";

/** Wrap a module's root layout with this: a switched-off module shows a stub instead of its screens. */
export function ModuleGate({ module, children }: { module: AppModule; children: ReactNode }) {
  const enabled = useModuleEnabled(module.id);
  if (enabled) return <>{children}</>;

  return (
    <View style={styles.center}>
      <Text style={styles.title}>
        {module.icon} {module.title}
      </Text>
      <Text style={styles.text}>Модуль выключен.</Text>
      <Pressable style={styles.button} onPress={() => setModuleEnabled(module.id, true)}>
        <Text style={styles.buttonText}>Включить</Text>
      </Pressable>
    </View>
  );
}

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
      <Pressable
        style={[styles.button, styles.secondaryButton]}
        onPress={() => setModuleEnabled(module.id, false)}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Выключить модуль</Text>
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
    marginTop: 8,
    minWidth: 240,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryButton: { backgroundColor: "#f0f0f2" },
  secondaryButtonText: { color: "#1c1c1e" },
});
