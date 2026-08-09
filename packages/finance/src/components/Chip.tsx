import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f0f0f2",
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: "#1c1c1e",
  },
  chipText: {
    fontSize: 14,
    color: "#1c1c1e",
  },
  chipTextSelected: {
    color: "#ffffff",
  },
});
