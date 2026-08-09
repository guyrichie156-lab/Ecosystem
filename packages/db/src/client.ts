import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

export const DATABASE_NAME = "ecosystem.db";

export const sqliteDb = openDatabaseSync(DATABASE_NAME, {
  enableChangeListener: true,
});

export const db = drizzle(sqliteDb, { schema });
