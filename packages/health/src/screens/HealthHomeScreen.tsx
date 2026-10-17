import React from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { useAsyncData, useRefreshOnFocus } from "@ecosystem/core";
import { BODY_MEASUREMENT_KINDS, KIND_INFO, formatChange, formatMeasurement, type BodyMeasurementKind } from "../lib/kinds";
import { getLatestMeasurements, type LatestMeasurement } from "../lib/measurements";

const dayFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

function ZoneRow({
  kind,
  latest,
  onPress,
}: {
  kind: BodyMeasurementKind;
  latest: LatestMeasurement | undefined;
  onPress: (kind: BodyMeasurementKind) => void;
}) {
  const change = latest && latest.previous !== null ? latest.value - latest.previous : null;
  return (
    <Pressable style={styles.row} onPress={() => onPress(kind)} disabled={!latest}>
      <Text style={styles.rowLabel}>{KIND_INFO[kind].label}</Text>
      <View style={styles.rowRight}>
        <Text style={latest ? styles.rowValue : styles.rowEmpty}>
          {latest ? formatMeasurement(kind, latest.value) : "—"}
        </Text>
        {change !== null && <Text style={styles.rowChange}>{formatChange(kind, change)}</Text>}
      </View>
    </Pressable>
  );
}

export function HealthHomeScreen() {
  const router = useRouter();
  const { data, loading, refresh } = useAsyncData(getLatestMeasurements, []);
  useRefreshOnFocus(refresh);

  const byKind = new Map((data ?? []).map((m) => [m.kind, m]));
  const lastDate = data && data.length > 0 ? Math.max(...data.map((m) => m.measuredAt)) : null;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={BODY_MEASUREMENT_KINDS}
      keyExtractor={(kind) => kind}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      ListHeaderComponent={
        <View>
          <Text style={styles.subtitle}>
            {lastDate
              ? `Последний замер: ${dayFormat.format(new Date(lastDate))}`
              : loading
                ? " "
                : "Замеров пока нет — внесите первый."}
          </Text>
          <Link href="/health/add" asChild>
            <Pressable style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Новый замер</Text>
            </Pressable>
          </Link>
          <Text style={styles.sectionTitle}>Зоны</Text>
        </View>
      }
      renderItem={({ item }) => (
        <ZoneRow kind={item} latest={byKind.get(item)} onPress={(kind) => router.push(`/health/${kind}`)} />
      )}
      ListFooterComponent={
        <Text style={styles.hint}>Справа — изменение с предыдущего замера. Нажмите на зону, чтобы увидеть график.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14, color: "#8a8a8e", marginTop: 8 },
  addButton: {
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  addButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1c1c1e", marginBottom: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5ea",
  },
  rowLabel: { fontSize: 15, color: "#1c1c1e" },
  rowRight: { alignItems: "flex-end" },
  rowValue: { fontSize: 15, fontWeight: "600", color: "#1c1c1e" },
  rowEmpty: { fontSize: 15, color: "#c7c7cc" },
  rowChange: { fontSize: 12, color: "#8a8a8e", marginTop: 2 },
  hint: { fontSize: 13, color: "#8a8a8e", marginTop: 16 },
});
