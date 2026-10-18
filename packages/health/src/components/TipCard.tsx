import React from "react";
import { Linking, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useThemedStyles, type Theme } from "@ecosystem/core";
import type { Tip } from "../lib/tips";

export function TipCard({
  tip,
  onAction,
  style,
}: {
  tip: Tip;
  onAction: (action: "profile") => void;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.card, style]}>
      {tip.attention && <Text style={styles.attention}>⚠️ Обратите внимание</Text>}
      <Text style={styles.title}>{tip.title}</Text>
      <Text style={styles.text}>{tip.text}</Text>
      {tip.source && (
        <Pressable onPress={() => Linking.openURL(tip.source!.url)} accessibilityRole="link" hitSlop={8}>
          <Text style={styles.source}>Источник: {tip.source.label} ↗</Text>
        </Pressable>
      )}
      {tip.action === "profile" && (
        <Pressable style={styles.actionButton} onPress={() => onAction("profile")}>
          <Text style={styles.actionText}>Указать рост</Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: { backgroundColor: t.card, borderRadius: 12, padding: 14, marginBottom: 10 },
    attention: { fontSize: 12, fontWeight: "700", color: t.text, marginBottom: 6 },
    title: { fontSize: 15, fontWeight: "600", color: t.text },
    text: { fontSize: 14, color: t.textSecondary, marginTop: 4, lineHeight: 20 },
    // t.link on the card: 5.58:1 light, 6.15:1 dark (WCAG AA needs 4.5:1 for small text).
    source: { fontSize: 12, color: t.link, marginTop: 8 },
    actionButton: {
      alignSelf: "flex-start",
      backgroundColor: t.primary,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginTop: 10,
    },
    actionText: { color: t.onPrimary, fontWeight: "600", fontSize: 14 },
  });
