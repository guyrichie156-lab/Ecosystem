import { SQLiteStorage } from "expo-sqlite/kv-store";

export const SETTINGS_DATABASE_NAME = "ecosystem-settings.db";

/** Small per-device settings (profile, import state, goals); kept apart from the main database. */
export const settingsStorage = new SQLiteStorage(SETTINGS_DATABASE_NAME);
