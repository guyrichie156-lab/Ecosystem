import React from "react";
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { useThemedStyles, type Theme } from "./theme";

/**
 * The main button of a form or screen, in the primary colour. While `busy` it shows `busyLabel`
 * and ignores taps. Other Pressable props pass through, so it also works inside `<Link asChild>`.
 */
export function PrimaryButton({
  label,
  busy = false,
  busyLabel = "Сохранение…",
  style,
  ...pressable
}: Omit<PressableProps, "style" | "children"> & {
  label: string;
  busy?: boolean;
  busyLabel?: string;
  /** Outer spacing only, such as a top margin; the look comes from the theme. */
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: busy, busy }}
      {...pressable}
      disabled={busy || pressable.disabled}
      style={[styles.button, style]}
    >
      <Text style={styles.text}>{busy ? busyLabel : label}</Text>
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    button: { backgroundColor: t.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignItems: "center" },
    text: { color: t.onPrimary, fontWeight: "700", fontSize: 16 },
  });
