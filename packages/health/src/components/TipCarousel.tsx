import React, { useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useThemedStyles, type Theme } from "@ecosystem/core";
import type { Tip } from "../lib/tips";
import { TipCard } from "./TipCard";

/** Tips one card at a time: swipe sideways, or tap a dot. Attention tips come first (getHealthTips orders them). */
export function TipCarousel({ tips }: { tips: Tip[] }) {
  const styles = useThemedStyles(makeStyles);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<Tip>>(null);
  const current = Math.min(index, tips.length - 1);

  if (tips.length === 0) return null;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.header}>
        <Text style={styles.title}>Подсказки</Text>
        <Text style={styles.counter}>
          {current + 1} из {tips.length}
        </Text>
      </View>
      {width > 0 && (
        <FlatList
          ref={list}
          horizontal
          pagingEnabled
          data={tips}
          keyExtractor={(tip) => tip.id}
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          // onScroll rather than onMomentumScrollEnd: the latter doesn't fire in the web version.
          scrollEventThrottle={16}
          onScroll={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <View style={{ width }}>
              <TipCard tip={item} style={styles.card} />
            </View>
          )}
        />
      )}
      {tips.length > 1 && (
        <View style={styles.dots}>
          {tips.map((tip, i) => (
            <Pressable
              key={tip.id}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Подсказка ${i + 1} из ${tips.length}`}
              onPress={() => list.current?.scrollToIndex({ index: i })}
            >
              <View style={[styles.dot, i === current && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
    title: { fontSize: 16, fontWeight: "600", color: t.text },
    counter: { fontSize: 13, color: t.textMuted },
    // Cards stretch to the tallest one, so the dots don't jump while swiping.
    card: { flex: 1, marginBottom: 0 },
    dots: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 10 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.border },
    dotActive: { backgroundColor: t.primary },
  });
