import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAsyncData, useRefreshOnFocus, useThemedStyles, type Theme } from "@ecosystem/core";
import { getHealthConnectStatus, openHealthConnectInStore, requestHealthConnectAccess } from "../lib/healthConnect";
import { getLastHealthConnectImport, importFromHealthConnect } from "../lib/healthConnectSync";

const timeFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Connects Health Connect and imports from it. Renders nothing where Health Connect doesn't exist. */
export function HealthConnectCard({ onImported }: { onImported: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { data: status, refresh } = useAsyncData(getHealthConnectStatus, []);
  // Permissions can change in the Health Connect app while this screen is in the background.
  useRefreshOnFocus(refresh);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!status || status === "unsupported") return null;

  async function runImport() {
    setBusy(true);
    setMessage(null);
    try {
      const { added } = await importFromHealthConnect();
      setMessage(added > 0 ? `Добавлено записей: ${added}` : "Новых записей нет");
      onImported();
    } catch (e) {
      setMessage(`Не удалось загрузить данные: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
      refresh();
    }
  }

  async function connect() {
    setBusy(true);
    try {
      const granted = await requestHealthConnectAccess();
      if (granted) await runImport();
      else setMessage("Доступ не выдан. Разрешения можно изменить в Health Connect.");
    } catch (e) {
      setMessage(`Не удалось подключить Health Connect: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
      refresh();
    }
  }

  const lastImport = getLastHealthConnectImport();
  let text: string;
  let action: { label: string; onPress: () => void };
  switch (status) {
    case "not_installed":
      text = "Health Connect не установлен. На Android 13 и ниже его ставят из Google Play.";
      action = { label: "Открыть Google Play", onPress: openHealthConnectInStore };
      break;
    case "update_required":
      text = "Нужно обновить Health Connect.";
      action = { label: "Открыть Google Play", onPress: openHealthConnectInStore };
      break;
    case "no_permission":
      text = "Health Connect собирает данные с разных приложений и устройств. Можно подтягивать оттуда вес, процент жира и рост.";
      action = { label: "Подключить", onPress: connect };
      break;
    default:
      text = lastImport ? `Подключён · обновлено ${timeFormat.format(new Date(lastImport))}` : "Подключён";
      action = { label: "Обновить сейчас", onPress: runImport };
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Health Connect</Text>
      <Text style={styles.text}>{text}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      <Pressable style={[styles.button, busy && styles.buttonBusy]} onPress={action.onPress} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? "Загрузка…" : action.label}</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: { backgroundColor: t.card, borderRadius: 12, padding: 14, marginBottom: 16 },
    title: { fontSize: 15, fontWeight: "600", color: t.text },
    text: { fontSize: 14, color: t.textSecondary, marginTop: 4, lineHeight: 20 },
    message: { fontSize: 13, color: t.textSecondary, marginTop: 6 },
    button: {
      alignSelf: "flex-start",
      backgroundColor: t.primary,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginTop: 10,
    },
    buttonBusy: { opacity: 0.6 },
    buttonText: { color: t.onPrimary, fontWeight: "600", fontSize: 14 },
  });
