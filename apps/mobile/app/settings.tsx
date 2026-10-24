import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { reloadAppAsync } from "expo";
import { File as FsFile, Paths } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { PrimaryButton, TextField, describeError, useThemedStyles, type Theme } from "@ecosystem/core";
import { BackupError, checkRecoveryKey, createBackup, restoreBackup, type BackupErrorCode } from "@ecosystem/db";

const BACKUP_ERRORS: Record<BackupErrorCode, string> = {
  "not-a-backup": "Это не файл копии «Хаты». Выберите файл с окончанием .hata.",
  "newer-format": "Копия сделана в более новой версии приложения. Сначала обновите приложение.",
  "newer-app": "Копия сделана в более новой версии приложения. Сначала обновите приложение.",
  "wrong-key": "Ключ не подходит к этому файлу. Проверьте ключ: 64 буквы и цифры. Если ключ верный, файл повреждён.",
  damaged: "Файл копии повреждён. Попробуйте другой файл.",
};

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

/** Saves the encrypted copy where the user chooses: the share sheet (Files, Drive, Telegram) or a download on the web. */
async function saveBackupFile(bytes: Uint8Array, name: string) {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/octet-stream" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new FsFile(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(bytes);
  await Sharing.shareAsync(file.uri, { mimeType: "application/octet-stream", dialogTitle: "Сохранить копию «Хаты»" });
}

async function readPickedFile(asset: DocumentPicker.DocumentPickerAsset): Promise<Uint8Array> {
  if (asset.file) return new Uint8Array(await asset.file.arrayBuffer());
  return new FsFile(asset.uri).bytes();
}

function ExportSection() {
  const styles = useThemedStyles(makeStyles);
  const [backup, setBackup] = useState<{ file: Uint8Array; recoveryKey: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCreate() {
    setBusy(true);
    setMessage(null);
    try {
      const { file, recoveryKey } = await createBackup();
      setBackup({ file, recoveryKey, name: `hata-${dateKey(new Date())}.hata` });
    } catch (e) {
      console.warn("Creating a backup failed:", describeError(e));
      setMessage("Не удалось сделать копию. Попробуйте ещё раз.");
    }
    setBusy(false);
  }

  async function handleSave() {
    if (!backup) return;
    try {
      await saveBackupFile(backup.file, backup.name);
    } catch (e) {
      console.warn("Saving a backup failed:", describeError(e));
      setMessage("Не удалось сохранить файл. Попробуйте ещё раз.");
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Копия данных</Text>
      <Text style={styles.text}>
        В копию входит всё: счета и операции, бюджеты, вес и тренировки, еда, профиль и норма. Файл зашифрован: открыть
        его можно только ключом восстановления.
      </Text>
      {!backup ? (
        <PrimaryButton label="Сделать копию" busy={busy} busyLabel="Копирую…" onPress={handleCreate} style={styles.button} />
      ) : (
        <>
          <View style={styles.keyBox}>
            <Text style={styles.keyLabel}>Ключ восстановления</Text>
            <Text style={styles.key} selectable accessibilityLabel={`Ключ восстановления: ${backup.recoveryKey}`}>
              {backup.recoveryKey}
            </Text>
          </View>
          <Text style={styles.warning}>
            Запишите ключ сейчас: в менеджер паролей или на бумагу. Он показывается один раз и нигде не хранится. Без
            ключа копию не открыть никому, в том числе вам.
          </Text>
          <PrimaryButton label="Сохранить файл" onPress={handleSave} style={styles.button} />
          <Text style={styles.muted}>
            Файл {backup.name}: сохраните его в «Загрузки», на Диск или в Telegram. Ключ храните отдельно от файла.
          </Text>
        </>
      )}
      {message && <Text style={styles.error}>{message}</Text>}
    </View>
  );
}

function RestoreSection() {
  const styles = useThemedStyles(makeStyles);
  const [picked, setPicked] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [keyText, setKeyText] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  async function handlePick() {
    setMessage(null);
    setConfirm(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPicked({ name: asset.name, bytes: await readPickedFile(asset) });
    } catch (e) {
      console.warn("Reading a backup file failed:", describeError(e));
      setMessage({ error: true, text: "Не удалось открыть файл. Попробуйте ещё раз." });
    }
  }

  async function handleRestore() {
    if (!picked) return;
    try {
      checkRecoveryKey(keyText);
    } catch {
      setMessage({ error: true, text: BACKUP_ERRORS["wrong-key"] });
      return;
    }
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await restoreBackup(picked.bytes, keyText);
      setMessage({ error: false, text: "Готово. Приложение перезапускается…" });
      await reloadAppAsync("Data restored from a backup");
    } catch (e) {
      if (e instanceof BackupError) {
        setMessage({ error: true, text: BACKUP_ERRORS[e.code] });
      } else {
        console.warn("Restoring a backup failed:", describeError(e));
        setMessage({ error: true, text: "Не удалось восстановить данные. Попробуйте ещё раз." });
      }
      setConfirm(false);
      setBusy(false);
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Восстановить из копии</Text>
      <Text style={styles.text}>Например, на новом телефоне или в новой версии приложения.</Text>
      <Pressable onPress={handlePick} style={styles.pick} accessibilityRole="button">
        <Text style={styles.link}>{picked ? `Файл: ${picked.name} — выбрать другой` : "Выбрать файл копии"}</Text>
      </Pressable>
      {picked && (
        <>
          <Text style={styles.keyLabel}>Ключ восстановления</Text>
          <TextField
            value={keyText}
            onChangeText={(text) => {
              setKeyText(text);
              setConfirm(false);
            }}
            placeholder="XXXX-XXXX-…"
            autoCapitalize="characters"
            autoCorrect={false}
            multiline
            accessibilityLabel="Ключ восстановления"
          />
          {confirm && (
            <Text style={styles.warning}>
              Все данные на этом телефоне заменятся данными из копии. Нажмите «Восстановить» ещё раз.
            </Text>
          )}
          <PrimaryButton label="Восстановить" busy={busy} busyLabel="Восстанавливаю…" onPress={handleRestore} style={styles.button} />
        </>
      )}
      {message && <Text style={message.error ? styles.error : styles.done}>{message.text}</Text>}
    </View>
  );
}

/** Settings for the whole app (not one module): for now the backup, later the theme. */
export default function SettingsScreen() {
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ headerShown: true, title: "Настройки" }} />
      <Text style={styles.heading}>Резервная копия</Text>
      <ExportSection />
      <RestoreSection />
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    content: { padding: 20, paddingBottom: 40 },
    heading: { fontSize: 13, fontWeight: "600", color: t.textMuted, textTransform: "uppercase", marginBottom: 8 },
    section: { backgroundColor: t.card, borderRadius: 14, padding: 16, marginBottom: 16 },
    title: { fontSize: 17, fontWeight: "600", color: t.text },
    text: { fontSize: 14, color: t.textSecondary, marginTop: 6, lineHeight: 20 },
    button: { marginTop: 14 },
    keyBox: { backgroundColor: t.fill, borderRadius: 10, padding: 12, marginTop: 14 },
    keyLabel: { fontSize: 13, color: t.textMuted, marginTop: 14, marginBottom: 6 },
    key: { fontSize: 16, color: t.text, fontFamily: Platform.select({ android: "monospace", ios: "Menlo", default: "monospace" }), lineHeight: 24 },
    warning: { fontSize: 14, color: t.text, marginTop: 10, lineHeight: 20, fontWeight: "600" },
    muted: { fontSize: 13, color: t.textMuted, marginTop: 8, lineHeight: 18 },
    pick: { marginTop: 12, paddingVertical: 6 },
    link: { fontSize: 15, color: t.link },
    error: { color: t.danger, fontSize: 14, marginTop: 12 },
    done: { color: t.income, fontSize: 14, marginTop: 12 },
  });
