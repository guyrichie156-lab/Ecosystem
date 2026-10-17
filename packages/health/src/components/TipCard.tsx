import React from "react";
import { Linking, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
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

const styles = StyleSheet.create({
  card: { backgroundColor: "#f5f5f7", borderRadius: 12, padding: 14, marginBottom: 10 },
  attention: { fontSize: 12, fontWeight: "700", color: "#1c1c1e", marginBottom: 6 },
  title: { fontSize: 15, fontWeight: "600", color: "#1c1c1e" },
  text: { fontSize: 14, color: "#3a3a3c", marginTop: 4, lineHeight: 20 },
  // 5.6:1 on the card background (WCAG AA needs 4.5:1 for small text).
  source: { fontSize: 12, color: "#1f62b3", marginTop: 8 },
  actionButton: {
    alignSelf: "flex-start",
    backgroundColor: "#1c1c1e",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  actionText: { color: "#ffffff", fontWeight: "600", fontSize: 14 },
});
