import { SQLiteStorage } from "expo-sqlite/kv-store";

/** Small per-device settings (profile, import state); kept apart from the main database. */
export const settingsStorage = new SQLiteStorage("ecosystem-settings.db");
