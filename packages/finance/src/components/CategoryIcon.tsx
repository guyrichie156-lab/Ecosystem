import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useThemedStyles, type Theme } from "@ecosystem/core";

/** A category's emoji in a round tile; transfers and categories without an icon get a neutral one. */
export function CategoryIcon({ icon, transfer = false }: { icon: string | null; transfer?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.tile} importantForAccessibility="no-hide-descendants">
      <Text style={styles.emoji}>{transfer ? "↔️" : (icon ?? "💰")}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    tile: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.fill, alignItems: "center", justifyContent: "center" },
    emoji: { fontSize: 20 },
  });
