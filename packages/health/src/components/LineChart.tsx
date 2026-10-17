import React, { useState } from "react";
import { Platform, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { niceTicks } from "@ecosystem/core";

// Single-series line chart. Colors: series = categorical slot 1 of the dataviz
// reference palette (validated on the white surface), text and grid in neutral tokens.
const SERIES = "#2a78d6";
const SURFACE = "#ffffff";
const GRID = "#e5e5ea";
const TEXT_MUTED = "#8a8a8e";

// SVG text falls back to a serif font in browsers; use the system UI font there.
const FONT = Platform.OS === "web" ? "system-ui, sans-serif" : undefined;

const HEIGHT = 200;
const PAD = { top: 12, right: 16, bottom: 24, left: 44 };

export type ChartPoint = { x: number; y: number };

const shortDate = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

export function LineChart({
  points,
  selectedIndex,
  onSelect,
  formatTick,
  minTickStep = 0,
  accessibilityLabel,
}: {
  /** Oldest first; `x` is a timestamp, `y` a value in displayed units. */
  points: ChartPoint[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatTick: (value: number) => string;
  /** Smallest step between ticks, in displayed units. */
  minTickStep?: number;
  accessibilityLabel: string;
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const ys = points.map((p) => p.y);
  const ticks = niceTicks(Math.min(...ys), Math.max(...ys), minTickStep);
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const xMin = points[0].x;
  const xMax = points[points.length - 1].x;

  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const sx = (x: number) => PAD.left + (xMax === xMin ? plotW / 2 : ((x - xMin) / (xMax - xMin)) * plotW);
  const sy = (y: number) => PAD.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x)},${sy(p.y)}`).join(" ");

  // Tap anywhere on the plot: select the point closest in x.
  function selectNearest(e: GestureResponderEvent) {
    const touchX = e.nativeEvent.locationX;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(sx(p.x) - touchX) < Math.abs(sx(points[best].x) - touchX)) best = i;
    });
    onSelect(best);
  }

  return (
    <View
      onLayout={onLayout}
      style={{ height: HEIGHT }}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {ticks.map((t) => (
            <React.Fragment key={t}>
              <Line x1={PAD.left} x2={width - PAD.right} y1={sy(t)} y2={sy(t)} stroke={GRID} strokeWidth={1} />
              <SvgText x={PAD.left - 8} y={sy(t) + 4} fontSize={11} fontFamily={FONT} fill={TEXT_MUTED} textAnchor="end">
                {formatTick(t)}
              </SvgText>
            </React.Fragment>
          ))}
          <SvgText x={sx(xMin)} y={HEIGHT - 6} fontSize={11} fontFamily={FONT} fill={TEXT_MUTED} textAnchor="start">
            {shortDate.format(new Date(xMin))}
          </SvgText>
          {xMax !== xMin && (
            <SvgText x={sx(xMax)} y={HEIGHT - 6} fontSize={11} fontFamily={FONT} fill={TEXT_MUTED} textAnchor="end">
              {shortDate.format(new Date(xMax))}
            </SvgText>
          )}
          <Path d={path} stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" fill="none" />
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={i === selectedIndex ? 6 : 4}
              fill={SERIES}
              stroke={SURFACE}
              strokeWidth={2}
            />
          ))}
        </Svg>
      )}
      {/* Taps land on this plain layer, never on an SVG shape (react-native-svg can make a shape the touch target), so locationX is always measured from the chart. */}
      <View style={StyleSheet.absoluteFill} onStartShouldSetResponder={() => true} onResponderGrant={selectNearest} />
    </View>
  );
}
