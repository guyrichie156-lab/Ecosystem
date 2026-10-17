import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import Svg, { Line, Path, Text as SvgText } from "react-native-svg";
import { niceTicks } from "@ecosystem/core";
import { formatMinorUnits } from "../lib/money";
import type { MonthSpend } from "../lib/chartData";

// One series, so one hue: the selected month in categorical slot 1, the rest in the lightest step
// of the same blue ramp the palette allows for discrete marks (step 250, 2.06:1 on white).
// Values never depend on the color: the caption names the selected month and the table lists all.
const SELECTED = "#2a78d6";
const REST = "#86b6ef";
const GRID = "#e5e5ea";
const BASELINE = "#c7c7cc";
const TEXT_MUTED = "#6e6e73";

// SVG text falls back to a serif font in browsers; use the system UI font there.
const FONT = Platform.OS === "web" ? "system-ui, sans-serif" : undefined;

const HEIGHT = 180;
const PAD = { top: 10, right: 8, bottom: 24, left: 48 };
const MAX_BAR = 24;
const CORNER = 4;

const monthShort = new Intl.DateTimeFormat("ru-RU", { month: "short" });
const monthLong = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });

/** Axis ticks in whole rubles, compact from a thousand up: 0 / 500 / 1 тыс. / 1,5 тыс. */
function formatTick(rubles: number): string {
  if (rubles < 1000) return String(rubles);
  return `${(rubles / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} тыс.`;
}

/** Column rounded at the top only (the data end), square at the baseline. */
function column(x: number, w: number, top: number, bottom: number): string {
  const r = Math.min(CORNER, w / 2, bottom - top);
  return `M${x},${bottom} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${bottom} Z`;
}

/** Expenses per month, oldest first; tap a column to read it. */
export function MonthlyBars({ months }: { months: MonthSpend[] }) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(months.length - 1);
  const [showTable, setShowTable] = useState(false);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const ticks = niceTicks(0, Math.max(...months.map((m) => m.amount / 100), 1), 1);
  const yMax = ticks[ticks.length - 1];
  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = plotW / months.length;
  const barW = Math.min(MAX_BAR, band * 0.6);
  const sy = (rubles: number) => PAD.top + (1 - rubles / yMax) * plotH;
  const bottom = sy(0);
  const current = months[Math.min(selected, months.length - 1)];

  function onPlotPress(e: GestureResponderEvent) {
    const i = Math.floor((e.nativeEvent.locationX - PAD.left) / band);
    if (i >= 0 && i < months.length) setSelected(i);
  }

  return (
    <View>
      <Text style={styles.caption}>
        {monthLong.format(new Date(current.monthStart))}: <Text style={styles.captionValue}>{formatMinorUnits(current.amount)}</Text>
      </Text>
      <View
        onLayout={onLayout}
        style={{ height: HEIGHT }}
        accessible
        accessibilityLabel={`Расходы по месяцам: ${months
          .map((m) => `${monthShort.format(new Date(m.monthStart))} ${formatMinorUnits(m.amount)}`)
          .join(", ")}`}
      >
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            {ticks.map((t) => (
              <React.Fragment key={t}>
                <Line x1={PAD.left} x2={width - PAD.right} y1={sy(t)} y2={sy(t)} stroke={t === 0 ? BASELINE : GRID} strokeWidth={1} />
                <SvgText x={PAD.left - 8} y={sy(t) + 4} fontSize={11} fontFamily={FONT} fill={TEXT_MUTED} textAnchor="end">
                  {formatTick(t)}
                </SvgText>
              </React.Fragment>
            ))}
            {months.map((m, i) => {
              const x = PAD.left + band * i + (band - barW) / 2;
              const top = sy(m.amount / 100);
              return (
                <React.Fragment key={m.monthStart}>
                  {m.amount > 0 && (
                    <Path d={column(x, barW, top, bottom)} fill={i === selected ? SELECTED : REST} />
                  )}
                  <SvgText
                    x={x + barW / 2}
                    y={HEIGHT - 6}
                    fontSize={11}
                    fontFamily={FONT}
                    fill={TEXT_MUTED}
                    fontWeight={i === selected ? "700" : "400"}
                    textAnchor="middle"
                  >
                    {monthShort.format(new Date(m.monthStart))}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        )}
        {/* Taps land on this plain layer, never on an SVG shape (react-native-svg can make a shape the touch target), so locationX is always measured from the chart. */}
        <View style={StyleSheet.absoluteFill} onStartShouldSetResponder={() => true} onResponderGrant={onPlotPress} />
      </View>
      <Pressable onPress={() => setShowTable(!showTable)} hitSlop={8} accessibilityRole="button">
        <Text style={styles.toggle}>{showTable ? "Скрыть цифры" : "Показать цифрами"}</Text>
      </Pressable>
      {showTable &&
        [...months].reverse().map((m) => (
          <View key={m.monthStart} style={styles.tableRow}>
            <Text style={styles.tableMonth}>{monthLong.format(new Date(m.monthStart))}</Text>
            <Text style={styles.tableValue}>{formatMinorUnits(m.amount)}</Text>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { fontSize: 14, color: "#6e6e73", marginBottom: 6 },
  captionValue: { color: "#1c1c1e", fontWeight: "600" },
  // 6.08:1 on white, the same link blue as elsewhere in the app.
  toggle: { fontSize: 14, color: "#1f62b3", marginTop: 8, paddingVertical: 4 },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5ea",
  },
  tableMonth: { fontSize: 15, color: "#1c1c1e" },
  tableValue: { fontSize: 15, color: "#1c1c1e", fontWeight: "600", fontVariant: ["tabular-nums"] },
});
