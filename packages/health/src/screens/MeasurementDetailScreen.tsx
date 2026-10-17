import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAsyncData, useRefreshOnFocus } from "@ecosystem/core";
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
  const [confirming, setConfirming] = useState(false);
  return (
    <View style={styles.row}>
      <Text style={styles.rowDate}>{dateFormat.format(new Date(point.measuredAt))}</Text>
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
  const router = useRouter();
  const info = KIND_INFO[kind];
  const { data, loading, refresh } = useAsyncData(() => getMeasurementSeries(kind), [kind]);
  useRefreshOnFocus(refresh);

  const points = data ?? [];
  const [selected, setSelected] = useState(-1);
  // Default to the latest point whenever the series changes.
  useEffect(() => setSelected(points.length - 1), [points.length]);

  async function handleDelete(id: number) {
    await deleteMeasurement(id);
    if (points.length === 1) router.back();
    else refresh();
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
              onSelect={setSelected}
              formatTick={(v) => tickFormat.format(v)}
              minTickStep={0.1}
              accessibilityLabel={`График: ${info.label}, ${points.length} замеров. Значения — в списке ниже.`}
            />
          ) : (
            !loading && <Text style={styles.note}>Для графика нужно хотя бы два замера.</Text>
          )}
          <Text style={styles.sectionTitle}>Все замеры</Text>
        </View>
      }
      renderItem={({ item }) => <EntryRow kind={kind} point={item} onDelete={handleDelete} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 20, paddingBottom: 40 },
  hero: { marginBottom: 12 },
  heroValue: { fontSize: 34, fontWeight: "700", color: "#1c1c1e" },
  heroCaption: { fontSize: 14, color: "#8a8a8e", marginTop: 4 },
  note: { fontSize: 14, color: "#8a8a8e", marginVertical: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1c1c1e", marginTop: 20, marginBottom: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5ea",
  },
  rowDate: { flex: 1, fontSize: 15, color: "#1c1c1e" },
  rowValue: { fontSize: 15, fontWeight: "600", color: "#1c1c1e", marginRight: 12 },
  deleteButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#f0f0f2" },
  deleteButtonConfirm: { backgroundColor: "#fdecea" },
  deleteText: { fontSize: 13, color: "#c62828", fontWeight: "600" },
});
