import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Link } from "expo-router";
import { useThemedStyles, type Theme } from "./theme";

/** ⚙ in a module's header: opens the app's settings (backup), shared by every module. */
export function SettingsButton() {
  const styles = useThemedStyles(makeStyles);
  return (
    <Link href="/settings" asChild>
      <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Настройки" style={styles.button}>
        <Text style={styles.icon}>⚙</Text>
      </Pressable>
    </Link>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    button: { paddingHorizontal: 12 },
    icon: { fontSize: 20, color: t.text },
  });
