import React from "react";
import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import { useThemedStyles, type Theme } from "./theme";

/**
 * The round «+» in the bottom right corner: the screen's main "add" action. Put it last inside a
 * screen whose container has `flex: 1`. `label` is what a screen reader says, e.g. «Новая запись».
 * Other Pressable props pass through, so it also works inside `<Link asChild>`.
 */
export function FloatingAddButton({ label, ...pressable }: Omit<PressableProps, "style" | "children"> & { label: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} {...pressable} style={styles.button}>
      <Text style={styles.plus}>+</Text>
    </Pressable>
  );
}

/**
 * Bottom padding for a list under the button, so its last row can scroll above it instead of hiding
 * under it: the button is 60 px tall and 24 px from the bottom, plus some room.
 */
export const FLOATING_BUTTON_CLEARANCE = 110;

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    button: {
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
    plus: { fontSize: 34, lineHeight: 38, color: t.onAccent, fontWeight: "400" },
  });
