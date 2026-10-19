import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ErrorBoundaryProps } from "expo-router";
import type { AppModule } from "./types";
import { useThemedStyles, type Theme } from "./theme";
import { PrimaryButton } from "./PrimaryButton";

/**
 * Re-export from a module's root `_layout.tsx` as `ErrorBoundary`: a crash inside the module
 * replaces only that module's screens, the rest of the app keeps working.
 */
export function ModuleErrorFallback({ module, error, retry }: ErrorBoundaryProps & { module: AppModule }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.center}>
      <Text style={styles.title}>
        {module.icon} {module.title}
      </Text>
      <Text style={styles.text}>В модуле произошла ошибка. Остальное приложение работает.</Text>
      <Text style={styles.error} numberOfLines={4}>
        {error.message}
      </Text>
      <PrimaryButton label="Перезапустить модуль" onPress={retry} style={styles.button} />
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: t.background },
    title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: t.text },
    text: { fontSize: 16, color: t.textSecondary, textAlign: "center", marginBottom: 12 },
    error: { fontSize: 13, color: t.textMuted, textAlign: "center", marginBottom: 20 },
    button: { minWidth: 240 },
  });
