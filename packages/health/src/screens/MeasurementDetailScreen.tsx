import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { describeError, useAsyncData, useRefreshOnFocus, useThemedStyles, type Theme } from "@ecosystem/core";
import { LineChart } from "../components/LineChart";
import { KIND_INFO, formatChange, formatMeasurement, type BodyMeasurementKind } from "../lib/kinds";
import { deleteMeasurement, getMeasurementSeries, type MeasurementPoint } from "../lib/measurements";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const tickFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

function EntryRow({
  kind,
  point,
  onDelete,
}: {
  kind: BodyMeasurementKind;
  point: MeasurementPoint;
  onDelete: (id: number) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const [confirming, setConfirming] = useState(false);
  return (
    <View style={styles.row}>
      <View style={styles.rowDate}>
        <Text style={styles.rowDateText}>{dateFormat.format(new Date(point.measuredAt))}</Text>
        {point.source === "health_connect" && <Text style={styles.rowSource}>из Health Connect</Text>}
      </View>
      <Text style={styles.rowValue}>{formatMeasurement(kind, point.value)}</Text>
      {/* Two taps instead of a dialog: Alert has no buttons on web. */}
      <Pressable
        style={[styles.deleteButton, confirming && styles.deleteButtonConfirm]}
        onPress={() => (confirming ? onDelete(point.id) : setConfirming(true))}
        accessibilityLabel={confirming ? "Подтвердить удаление" : "Удалить замер"}
      >
        <Text style={styles.deleteText}>{confirming ? "Удалить?" : "✕"}</Text>
      </Pressable>
    </View>
  );
}

export function MeasurementDetailScreen({ kind }: { kind: BodyMeasurementKind }) {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const info = KIND_INFO[kind];
  const { data, loading, refresh } = useAsyncData(() => getMeasurementSeries(kind), [kind]);
  useRefreshOnFocus(refresh);

  const points = data ?? [];
  // The chosen point by id, so the choice survives a deletion; nothing chosen means the latest.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const chosen = points.findIndex((p) => p.id === selectedId);
  const selected = chosen >= 0 ? chosen : points.length - 1;

  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: number) {
    try {
      await deleteMeasurement(id);
      setError(null);
      if (points.length === 1) router.back();
      else refresh();
    } catch (e) {
      console.warn("Deleting a measurement failed:", describeError(e));
      setError("Не удалось удалить замер. Попробуйте ещё раз.");
    }
  }

  const current = points[selected];
  const before = points[selected - 1];

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={[...points].reverse()}
      keyExtractor={(p) => String(p.id)}
      ListHeaderComponent={
        <View>
          {current && (
            <View style={styles.hero}>
              <Text style={styles.heroValue}>{formatMeasurement(kind, current.value)}</Text>
              <Text style={styles.heroCaption}>
                {dateFormat.format(new Date(current.measuredAt))}
                {before ? ` · ${formatChange(kind, current.value - before.value)} с прошлого` : ""}
              </Text>
            </View>
          )}
          {points.length >= 2 ? (
            <LineChart
              points={points.map((p) => ({ x: p.measuredAt, y: p.value / info.scale }))}
              selectedIndex={selected}
              onSelect={(i) => setSelectedId(points[i]?.id ?? null)}
              formatTick={(v) => tickFormat.format(v)}
              minTickStep={0.1}
              accessibilityLabel={`График: ${info.label}, ${points.length} замеров. Значения — в списке ниже.`}
            />
          ) : (
            !loading && <Text style={styles.note}>Для графика нужно хотя бы два замера.</Text>
          )}
          <Text style={styles.sectionTitle}>Все замеры</Text>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      }
      renderItem={({ item }) => <EntryRow kind={kind} point={item} onDelete={handleDelete} />}
    />
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { padding: 20, paddingBottom: 40 },
    hero: { marginBottom: 12 },
    heroValue: { fontSize: 34, fontWeight: "700", color: t.text },
    heroCaption: { fontSize: 14, color: t.textMuted, marginTop: 4 },
    note: { fontSize: 14, color: t.textMuted, marginVertical: 12 },
    sectionTitle: { fontSize: 16, fontWeight: "600", color: t.text, marginTop: 20, marginBottom: 4 },
    error: { fontSize: 14, color: t.danger, marginVertical: 8 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.separator,
    },
    rowDate: { flex: 1 },
    rowDateText: { fontSize: 15, color: t.text },
    rowSource: { fontSize: 12, color: t.textMuted, marginTop: 2 },
    rowValue: { fontSize: 15, fontWeight: "600", color: t.text, marginRight: 12 },
    deleteButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: t.fill },
    deleteButtonConfirm: { backgroundColor: t.dangerBg },
    deleteText: { fontSize: 13, color: t.danger, fontWeight: "600" },
  });
