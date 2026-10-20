import { db, bodyMeasurements, getProfile, saveProfile, settingsStorage } from "@ecosystem/db";
import { readHealthConnectData } from "./healthConnect";
import {
  bodyFatToMeasurement,
  fallbackWindowStart,
  importWindowStart,
  latestHeightMm,
  weightToMeasurement,
  type ImportedMeasurement,
} from "./healthConnectMapping";

const LAST_IMPORT_KEY = "health.healthConnect.lastImportAt";
// Keeps each INSERT well under SQLite's limit on bound values.
const INSERT_CHUNK = 200;

const importListeners = new Set<() => void>();

/** Lets a screen refresh when an import that ran in the background (at app start) finishes. */
export function onHealthConnectImport(listener: () => void): () => void {
  importListeners.add(listener);
  return () => {
    importListeners.delete(listener);
  };
}

export function getLastHealthConnectImport(): number | null {
  const value = Number(settingsStorage.getItemSync(LAST_IMPORT_KEY));
  return value > 0 ? value : null;
}

export type HealthConnectImportResult = { added: number; importedAt: number };

/**
 * Reads weight, body fat and height from Health Connect since the last import and saves what's new.
 * Records already imported are skipped by their Health Connect id; a height fills the profile only
 * if the user hasn't entered one.
 */
export async function importFromHealthConnect(now = Date.now()): Promise<HealthConnectImportResult> {
  const lastImport = getLastHealthConnectImport();
  let data;
  try {
    data = await readHealthConnectData(importWindowStart(lastImport, now), now);
  } catch (e) {
    // A long break since the last import can reach past the 30-day read limit; retry within it.
    if (lastImport === null) throw e;
    data = await readHealthConnectData(fallbackWindowStart(now), now);
  }

  const rows = [...data.weights.map(weightToMeasurement), ...data.bodyFats.map(bodyFatToMeasurement)].filter(
    (m): m is ImportedMeasurement => m !== null
  );
  let added = 0;
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const inserted = await db
      .insert(bodyMeasurements)
      .values(rows.slice(i, i + INSERT_CHUNK).map((m) => ({ ...m, source: "health_connect" as const })))
      .onConflictDoNothing({ target: bodyMeasurements.externalId })
      .returning({ id: bodyMeasurements.id });
    added += inserted.length;
  }

  const heightMm = latestHeightMm(data.heights);
  const profile = getProfile();
  if (heightMm && !profile.heightMm) saveProfile({ ...profile, heightMm });

  settingsStorage.setItemSync(LAST_IMPORT_KEY, String(now));
  importListeners.forEach((listener) => listener());
  return { added, importedAt: now };
}
