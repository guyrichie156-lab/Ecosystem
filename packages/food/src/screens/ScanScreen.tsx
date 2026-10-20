import React, { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { PrimaryButton, describeError, useThemedStyles, type Theme } from "@ecosystem/core";
import { findFoodByBarcode, saveFood } from "../lib/foods";
import { isBarcode, lookUpBarcode } from "../lib/openFoodFacts";

/**
 * Scans a product barcode: a food scanned before is found on the phone; otherwise Open Food Facts is
 * asked. A product it knows fully is saved and its portion asked; anything else opens the label form.
 */
export function ScanScreen({ query }: { query: string }) {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<string | null>(null);
  // The camera reports the same code many times a second; only the first one is handled.
  const handling = useRef(false);

  async function handleCode(code: string) {
    if (handling.current || !isBarcode(code)) return;
    handling.current = true;
    setStatus(`Код ${code}: ищу…`);
    try {
      const known = await findFoodByBarcode(code);
      if (known) {
        router.replace(`/food/portion/${known.id}?${query}`);
        return;
      }
      const result = await lookUpBarcode(code);
      if (result.found && result.complete) {
        const { kcal, protein, fat, carbs } = result.per100g as Required<typeof result.per100g>;
        const id = await saveFood({
          name: result.name,
          brand: result.brand,
          barcode: code,
          source: "off",
          per100g: { kcal, protein, fat, carbs },
        });
        router.replace(`/food/portion/${id}?${query}`);
        return;
      }
      // Built by hand: React Native's URLSearchParams doesn't implement every method.
      const prefill: [string, string | number | null | undefined][] = [["barcode", code]];
      if (result.found) prefill.push(["name", result.name], ["brand", result.brand], ...Object.entries(result.per100g));
      const extra = prefill
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join("&");
      router.replace(`/food/custom?${query}&${extra}`);
    } catch (e) {
      console.warn("Barcode lookup failed:", describeError(e));
      setStatus("Нет связи с Open Food Facts. Проверьте интернет или внесите продукт с этикетки.");
      handling.current = false;
    }
  }

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.text}>Сканер работает в приложении на телефоне.</Text>
      </View>
    );
  }
  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.text}>Чтобы сканировать штрих-код, приложению нужен доступ к камере. Снимки не сохраняются.</Text>
        <PrimaryButton label="Разрешить камеру" onPress={requestPermission} style={styles.button} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "itf14"] }}
        onBarcodeScanned={({ data }) => handleCode(data)}
      />
      <View style={styles.panel}>
        <Text style={styles.text}>{status ?? "Наведите камеру на штрих-код упаковки."}</Text>
        <Pressable onPress={() => router.replace(`/food/custom?${query}`)} hitSlop={8} accessibilityRole="button">
          <Text style={styles.link}>Внести с этикетки вручную</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    center: { justifyContent: "center", padding: 24 },
    camera: { flex: 1 },
    panel: { padding: 20, gap: 12 },
    text: { fontSize: 15, color: t.text, textAlign: "center" },
    link: { fontSize: 15, color: t.link, textAlign: "center" },
    button: { marginTop: 20 },
  });
