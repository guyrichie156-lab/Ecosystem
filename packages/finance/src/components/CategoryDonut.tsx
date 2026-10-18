import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import { useTheme, useThemedStyles, type Theme } from "@ecosystem/core";
import Svg, { Circle, Path } from "react-native-svg";
import { formatMinorUnits } from "../lib/money";
import { wholePercentages, type DonutSegment } from "../lib/chartData";

// Slice colours: categorical slots 1–5 of the dataviz reference palette for the current theme, in
// their fixed order, and a gray for the folded tail (theme.chart; validation results in theme.ts).
// In the light theme slots 3–5 are below 3:1 against the background, so every value is also
// written in the list under the ring (the palette's relief rule). Slots go by size within the
// month: switching the month or the type redraws a whole new chart, not a filtered one.
const SIZE = 200;
const RING = 26;
const R = (SIZE - RING) / 2;
const C = SIZE / 2;
const GAP = 2; // px of surface between slices

export const segmentColor = (theme: Theme, segment: DonutSegment, index: number) =>
  segment.other ? theme.chart.other : theme.chart.slots[index];

function arc(start: number, end: number): string {
  const point = (a: number) => `${C + R * Math.sin(a)},${C - R * Math.cos(a)}`;
  const large = end - start > Math.PI ? 1 : 0;
  return `M${point(start)} A${R},${R} 0 ${large} 1 ${point(end)}`;
}

/**
 * A month's expenses or income by category as a ring, the total in the middle. The list under it
 * gives every category's amount and share with a bar, so no value depends on the colours.
 */
export function CategoryDonut({ segments, caption }: { segments: DonutSegment[]; caption: string }) {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const total = segments.reduce((sum, s) => sum + s.amount, 0);
  const percents = wholePercentages(segments.map((s) => s.amount));
  const largest = Math.max(...segments.map((s) => s.amount));

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
      ? { big: formatMinorUnits(total), small: caption }
      : { big: `${percents[selected]} %`, small: segments[selected].name };

  return (
    <View>
      <View style={styles.ring} accessible accessibilityLabel={`${caption}: ${formatMinorUnits(total)}. Доли — в списке ниже.`}>
        <Svg width={SIZE} height={SIZE}>
          {segments.length === 1 ? (
            <Circle cx={C} cy={C} r={R} stroke={segmentColor(theme, segments[0], 0)} strokeWidth={RING} fill="none" />
          ) : (
            slices.map((s, i) => (
              <Path
                key={i}
                d={arc(s.start, s.end)}
                stroke={segmentColor(theme, segments[i], i)}
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
          <View style={styles.rowTop}>
            <View style={[styles.swatch, { backgroundColor: segmentColor(theme, s, i) }]} />
            <Text style={styles.name} numberOfLines={1}>
              {s.icon ? `${s.icon} ` : ""}
              {s.name}
            </Text>
            <Text style={styles.amount}>{formatMinorUnits(s.amount)}</Text>
          </View>
          <View style={styles.rowBottom}>
            {/* Bars are scaled to the largest category, so the biggest one fills the track. */}
            <View style={styles.track}>
              <View style={[styles.bar, { width: `${(s.amount / largest) * 100}%`, backgroundColor: segmentColor(theme, s, i) }]} />
            </View>
            <Text style={styles.percent}>{percents[i]} %</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    ring: { width: SIZE, height: SIZE, alignSelf: "center", marginBottom: 16 },
    center: {
      position: "absolute",
      top: RING + 14,
      bottom: RING + 14,
      left: RING + 14,
      right: RING + 14,
      alignItems: "center",
      justifyContent: "center",
    },
    centerBig: { fontSize: 18, fontWeight: "700", color: t.text },
    centerSmall: { fontSize: 13, color: t.textMuted, marginTop: 2, textAlign: "center" },
    row: { paddingVertical: 9, paddingHorizontal: 6, borderRadius: 10 },
    rowSelected: { backgroundColor: t.card },
    rowTop: { flexDirection: "row", alignItems: "center" },
    swatch: { width: 12, height: 12, borderRadius: 3, marginRight: 10 },
    name: { flex: 1, fontSize: 15, color: t.text },
    amount: { fontSize: 15, color: t.text, fontWeight: "600" },
    rowBottom: { flexDirection: "row", alignItems: "center", marginTop: 6, marginLeft: 22 },
    track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: t.fill, overflow: "hidden" },
    bar: { height: 6, borderRadius: 3 },
    percent: { width: 52, fontSize: 13, color: t.textMuted, textAlign: "right" },
  });
