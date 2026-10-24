import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync } from "expo-crypto";
import { backupDatabaseAsync, deserializeDatabaseAsync, openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";
import { DATABASE_NAME, db, sqliteDb } from "./client";
import { SETTINGS_DATABASE_NAME } from "./settings";
import {
  BACKUP_FORMAT,
  BackupError,
  backupHeader,
  formatRecoveryKey,
  frameBackup,
  packBackup,
  parseRecoveryKey,
  unframeBackup,
  unpackBackup,
} from "./backupFormat";

export { BackupError, type BackupErrorCode } from "./backupFormat";

const appliedMigrations = () => migrations.journal.entries.length;

/**
 * Runs `task` on a separate connection to the settings database, so closing it afterwards can't
 * close the one the key-value store (`settingsStorage`) keeps open.
 */
async function withSettingsDatabase<T>(task: (database: SQLiteDatabase) => Promise<T>): Promise<T> {
  const database = await openDatabaseAsync(SETTINGS_DATABASE_NAME, { useNewConnection: true });
  try {
    return await task(database);
  } finally {
    await database.closeAsync();
  }
}

/**
 * A copy of everything: the main database (accounts, transactions, measurements, workouts, food)
 * and the settings database (profile, norm). Encrypted with AES-256-GCM under a new random key,
 * which is returned for the user to keep: without it the file can't be opened.
 */
export async function createBackup(): Promise<{ file: Uint8Array; recoveryKey: string }> {
  const main = await sqliteDb.serializeAsync();
  const settings = await withSettingsDatabase((database) => database.serializeAsync());
  const payload = packBackup({ format: BACKUP_FORMAT, createdAt: Date.now(), migrations: appliedMigrations() }, [
    { name: DATABASE_NAME, bytes: main },
    { name: SETTINGS_DATABASE_NAME, bytes: settings },
  ]);
  const key = await AESEncryptionKey.generate();
  const sealed = await aesEncryptAsync(payload, key, { additionalData: backupHeader() });
  return { file: frameBackup(await sealed.combined()), recoveryKey: formatRecoveryKey(await key.encoded("hex")) };
}

/** Throws `wrong-key` for a key that isn't 64 hex digits, before anything is read. */
export function checkRecoveryKey(text: string): void {
  if (!parseRecoveryKey(text)) throw new BackupError("wrong-key");
}

/** Copies a database from the backup over the live one, page by page (SQLite's backup API). */
async function restoreDatabase(bytes: Uint8Array, destDatabase: SQLiteDatabase) {
  const source = await deserializeDatabaseAsync(bytes);
  try {
    const check = await source.getFirstAsync<{ integrity_check: string }>("PRAGMA integrity_check");
    if (check?.integrity_check !== "ok") throw new BackupError("damaged");
    await backupDatabaseAsync({ sourceDatabase: source, destDatabase });
  } finally {
    await source.closeAsync();
  }
}

/**
 * Replaces all data on this phone with the backup's. Nothing is changed unless the file decrypts
 * with the key and both databases in it are whole. An older backup is brought up to this app's
 * tables by running the migrations it lacks. The app should restart afterwards, so every screen
 * and module reads the restored data.
 */
export async function restoreBackup(file: Uint8Array, recoveryKeyText: string): Promise<void> {
  const hex = parseRecoveryKey(recoveryKeyText);
  if (!hex) throw new BackupError("wrong-key");
  const sealed = unframeBackup(file);
  let payload: Uint8Array;
  try {
    const key = await AESEncryptionKey.import(hex, "hex");
    payload = await aesDecryptAsync(AESSealedData.fromCombined(sealed), key, { additionalData: backupHeader() });
  } catch {
    // AES-GCM can't tell a wrong key from a changed file: either way the tag doesn't match.
    throw new BackupError("wrong-key");
  }
  const { manifest, databases } = unpackBackup(payload);
  if (manifest.migrations > appliedMigrations()) throw new BackupError("newer-app");
  const main = databases.get(DATABASE_NAME);
  const settings = databases.get(SETTINGS_DATABASE_NAME);
  if (!main || !settings) throw new BackupError("damaged");

  await restoreDatabase(main, sqliteDb);
  await withSettingsDatabase((database) => restoreDatabase(settings, database));
  await migrate(db, migrations);
}
