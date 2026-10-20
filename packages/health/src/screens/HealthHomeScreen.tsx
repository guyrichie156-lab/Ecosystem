import React, { useEffect } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { getProfile } from "@ecosystem/db";
import { PrimaryButton, useAsyncData, useRefreshOnFocus, useThemedStyles, type Theme } from "@ecosystem/core";
import { ACTIVE_KINDS, KIND_INFO, formatChange, formatMeasurement, type BodyMeasurementKind } from "../lib/kinds";
import { getLatestMeasurements, getMeasurementSeries, type LatestMeasurement } from "../lib/measurements";
import { getHealthTips } from "../lib/tips";
import { TipCarousel } from "../components/TipCarousel";
import { HealthConnectCard } from "../components/HealthConnectCard";
import { onHealthConnectImport } from "../lib/healthConnectSync";

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
  const styles = useThemedStyles(makeStyles);
  const change = latest && latest.previous !== null ? latest.value - latest.previous : null;
  return (
    <Pressable style={styles.row} onPress={() => onPress(kind)} disabled={!latest}>
      <Text style={styles.rowLabel}>{KIND_INFO[kind].label}</Text>
      <View style={styles.rowRight}>
        <Text style={latest ? styles.rowValue : styles.rowEmpty}>
          {latest ? formatMeasurement(kind, latest.value) : "—"}
        </Text>
        {change !== null && <Text style={styles.rowChange}>{formatChange(kind, change)} с прошлого замера</Text>}
      </View>
    </Pressable>
  );
}

export function HealthHomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { data, loading, refreshing, refresh, pullToRefresh } = useAsyncData(async () => {
    const [latest, weightSeries] = await Promise.all([getLatestMeasurements(), getMeasurementSeries("weight")]);
    const profile = getProfile();
    return { latest, profile, tips: getHealthTips({ latest, weightSeries, profile }) };
  }, []);
  useRefreshOnFocus(refresh);
  useEffect(() => onHealthConnectImport(refresh), [refresh]);

  // Old rows of zones dropped from the MVP stay in the database; the screen ignores them.
  const latest = (data?.latest ?? []).filter((m) => (ACTIVE_KINDS as readonly BodyMeasurementKind[]).includes(m.kind));
  const byKind = new Map(latest.map((m) => [m.kind, m]));
  const lastDate = latest.length > 0 ? Math.max(...latest.map((m) => m.measuredAt)) : null;
  const tips = data?.tips ?? [];
  const openProfile = () => router.push("/health/profile");
  const profile = data?.profile;
  const profileSummary = profile
    ? [profile.heightMm ? `${profile.heightMm / 10} см` : null, profile.sex === "male" ? "мужской" : profile.sex === "female" ? "женский" : null]
        .filter(Boolean)
        .join(", ") || "не указаны"
    : "";

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={ACTIVE_KINDS}
      keyExtractor={(kind) => kind}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={pullToRefresh} />}
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
            <PrimaryButton label="+ Новый замер" style={styles.addButton} />
          </Link>
          <Link href="/health/profile" asChild>
            <Pressable style={styles.profileRow}>
              <Text style={styles.profileLabel}>Рост и пол</Text>
              <Text style={styles.profileValue}>{profileSummary} ›</Text>
            </Pressable>
          </Link>
          <HealthConnectCard onImported={refresh} />
          <Text style={styles.sectionTitle}>Зоны</Text>
        </View>
      }
      renderItem={({ item }) => (
        <ZoneRow kind={item} latest={byKind.get(item)} onPress={(kind) => router.push(`/health/${kind}`)} />
      )}
      ListFooterComponent={
        <View>
          <Text style={styles.hint}>Нажмите на зону, чтобы увидеть график.</Text>
          <View style={styles.tips}>
            <TipCarousel tips={tips} onAction={openProfile} />
          </View>
          {data && data.tips.length > 0 && (
            <Text style={styles.disclaimer}>
              Подсказки — справочная информация из открытых рекомендаций, не медицинская консультация.
            </Text>
          )}
        </View>
      }
    />
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { padding: 20, paddingBottom: 40 },
    subtitle: { fontSize: 14, color: t.textMuted, marginTop: 8 },
    addButton: { marginTop: 16, marginBottom: 12 },
    profileRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      marginBottom: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: t.separator,
    },
    profileLabel: { fontSize: 15, color: t.text },
    profileValue: { fontSize: 15, color: t.textMuted },
    disclaimer: { fontSize: 12, color: t.textMuted, marginTop: 10 },
    tips: { marginTop: 24 },
    sectionTitle: { fontSize: 16, fontWeight: "600", color: t.text, marginBottom: 8 },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.separator,
    },
    rowLabel: { fontSize: 15, color: t.text },
    rowRight: { alignItems: "flex-end" },
    rowValue: { fontSize: 15, fontWeight: "600", color: t.text },
    rowEmpty: { fontSize: 15, color: t.textMuted },
    rowChange: { fontSize: 12, color: t.textMuted, marginTop: 2 },
    hint: { fontSize: 13, color: t.textMuted, marginTop: 16 },
  });
