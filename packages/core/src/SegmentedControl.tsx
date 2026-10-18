import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemedStyles, type Theme } from "./theme";

/** A row of mutually exclusive options; the selected one is drawn as a filled pill. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            style={[styles.item, selected && styles.itemSelected]}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    track: { flexDirection: "row", backgroundColor: t.fill, borderRadius: 12, padding: 3 },
    item: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 9 },
    itemSelected: { backgroundColor: t.primary },
    label: { fontSize: 15, fontWeight: "600", color: t.text },
    labelSelected: { color: t.onPrimary },
  });
