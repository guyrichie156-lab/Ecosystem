import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { formatMinorUnits } from "../lib/money";
import { wholePercentages, type DonutSegment } from "../lib/chartData";

// Categorical slots 1–5 of the dataviz reference palette, in their fixed order. Validated on the
// white surface (scripts/validate_palette.js): worst adjacent CVD ΔE 9.1, normal vision 19.6; the
// pair that closes the ring (slot 5 next to slot 1) gives 13.0 / 27.5. Slots 3–5 are below 3:1
// against white, so every value is also written in the legend (the palette's relief rule).
// Slots go by size within the month: there is no filter that could repaint a category.
const SLOTS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];
const OTHER = "#aeaeb2"; // de-emphasis gray for the folded tail

const SIZE = 200;
const RING = 26;
const R = (SIZE - RING) / 2;
const C = SIZE / 2;
const GAP = 2; // px of surface between slices

export const segmentColor = (segment: DonutSegment, index: number) => (segment.other ? OTHER : SLOTS[index]);

function arc(start: number, end: number): string {
  const point = (a: number) => `${C + R * Math.sin(a)},${C - R * Math.cos(a)}`;
  const large = end - start > Math.PI ? 1 : 0;
  return `M${point(start)} A${R},${R} 0 ${large} 1 ${point(end)}`;
}

/** This month's expenses by category as a ring; the legend under it is the table of every value. */
export function ExpenseDonut({ segments, monthName }: { segments: DonutSegment[]; monthName: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const total = segments.reduce((sum, s) => sum + s.amount, 0);
  const percents = wholePercentages(segments.map((s) => s.amount));

  // Angles clockwise from 12 o'clock; each slice gives up GAP px of its arc to the surface.
  const gapAngle = segments.length > 1 ? GAP / R : 0;
  let cursor = 0;
  const slices = segments.map((s) => {
    const sweep = (s.amount / total) * 2 * Math.PI;
    const slice = { start: cursor + gapAngle / 2, end: cursor + sweep - gapAngle / 2 };
    cursor += sweep;
    return slice;
  });

  function onRingPress(e: GestureResponderEvent) {
    const dx = e.nativeEvent.locationX - C;
    const dy = e.nativeEvent.locationY - C;
    // Taps inside the hole clear the selection; the ring's hit area is wider than the ring.
    if (Math.hypot(dx, dy) < R - RING / 2 - 8) return setSelected(null);
    const angle = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI);
    const hit = slices.findIndex((s) => angle >= s.start - gapAngle / 2 && angle < s.end + gapAngle / 2);
    setSelected(hit === -1 || hit === selected ? null : hit);
  }

  const center =
    selected === null
      ? { big: formatMinorUnits(total), small: `за ${monthName}` }
      : { big: `${percents[selected]} %`, small: segments[selected].name };

  return (
    <View>
      <View
        style={styles.ring}
        accessible
        accessibilityLabel={`Расходы за ${monthName}: ${formatMinorUnits(total)}. Доли категорий — в списке ниже.`}
      >
        <Svg width={SIZE} height={SIZE}>
          {segments.length === 1 ? (
            <Circle cx={C} cy={C} r={R} stroke={segmentColor(segments[0], 0)} strokeWidth={RING} fill="none" />
          ) : (
            slices.map((s, i) => (
              <Path
                key={i}
                d={arc(s.start, s.end)}
                stroke={segmentColor(segments[i], i)}
                strokeWidth={RING}
                fill="none"
                opacity={selected === null || selected === i ? 1 : 0.3}
              />
            ))
          )}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.centerBig} numberOfLines={1} adjustsFontSizeToFit>
            {center.big}
          </Text>
          <Text style={styles.centerSmall} numberOfLines={2}>
            {center.small}
          </Text>
        </View>
        {/* Taps land on this plain layer, never on an SVG shape (react-native-svg can make a shape the touch target), so locationX is always measured from the chart. */}
        <View style={StyleSheet.absoluteFill} onStartShouldSetResponder={() => true} onResponderGrant={onRingPress} />
      </View>

      {segments.map((s, i) => (
        <Pressable
          key={`${s.categoryId}-${s.name}`}
          style={[styles.row, selected === i && styles.rowSelected]}
          onPress={() => setSelected(selected === i ? null : i)}
          accessibilityRole="button"
          accessibilityLabel={`${s.name}: ${formatMinorUnits(s.amount)}, ${percents[i]} %`}
        >
          <View style={[styles.swatch, { backgroundColor: segmentColor(s, i) }]} />
          <Text style={styles.name} numberOfLines={1}>
            {s.name}
          </Text>
          <Text style={styles.amount}>{formatMinorUnits(s.amount)}</Text>
          <Text style={styles.percent}>{percents[i]} %</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { width: SIZE, height: SIZE, alignSelf: "center", marginBottom: 12 },
  center: {
    position: "absolute",
    top: RING + 14,
    bottom: RING + 14,
    left: RING + 14,
    right: RING + 14,
    alignItems: "center",
    justifyContent: "center",
  },
  centerBig: { fontSize: 18, fontWeight: "700", color: "#1c1c1e" },
  centerSmall: { fontSize: 13, color: "#6e6e73", marginTop: 2, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 9, paddingHorizontal: 6, borderRadius: 8 },
  rowSelected: { backgroundColor: "#f0f0f2" },
  swatch: { width: 12, height: 12, borderRadius: 3, marginRight: 10 },
  name: { flex: 1, fontSize: 15, color: "#1c1c1e" },
  amount: { fontSize: 15, color: "#1c1c1e", fontWeight: "600" },
  percent: { width: 52, fontSize: 14, color: "#6e6e73", textAlign: "right" },
});
