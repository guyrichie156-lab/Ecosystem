import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useThemedStyles, type Theme } from "@ecosystem/core";

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
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
    chipSelected: {
      backgroundColor: t.primary,
    },
    chipText: {
      fontSize: 14,
      color: t.text,
    },
    chipTextSelected: {
      color: t.onPrimary,
    },
  });
