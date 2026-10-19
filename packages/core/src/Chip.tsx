import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useThemedStyles, type Theme } from "./theme";

/** One choice in a row of choices (record type, account, category, sex); the selected one is filled. */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: t.fill,
      marginRight: 8,
      marginBottom: 8,
    },
    chipSelected: { backgroundColor: t.primary },
    chipText: { fontSize: 14, color: t.text },
    chipTextSelected: { color: t.onPrimary },
  });
