// Pure conversion of Health Connect records into body measurements: no native code, no database,
// so it runs in unit tests. Record shapes follow react-native-health-connect 4.1.3 result types.
import type { BodyMeasurementKind } from "@ecosystem/db/src/schema";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Health Connect lets an app read data up to 30 days before permission was first granted; older
 * reads fail without the history permission. The first import stays a day inside that limit.
 */
export const FIRST_IMPORT_DAYS = 29;
/** Later imports start a day before the previous one, to pick up records a scale or watch synced late. */
export const OVERLAP_DAYS = 1;

type InstantRecord = { time: string; metadata?: { id?: string } };
export type HealthConnectWeight = InstantRecord & { weight: { inKilograms: number } };
/** `percentage` is 0–100, as in Health Connect's BodyFatRecord. */
export type HealthConnectBodyFat = InstantRecord & { percentage: number };
export type HealthConnectHeight = InstantRecord & { height: { inMeters: number } };

export type ImportedMeasurement = {
  kind: BodyMeasurementKind;
  value: number;
  measuredAt: number;
  externalId: string;
};

function toMeasurement(kind: BodyMeasurementKind, value: number, record: InstantRecord): ImportedMeasurement | null {
  const measuredAt = Date.parse(record.time);
  if (!Number.isFinite(measuredAt) || !Number.isFinite(value) || value <= 0) return null;
  // Health Connect gives every record an id; the fallback only guards against a missing one.
  const externalId = record.metadata?.id ? `hc:${record.metadata.id}` : `hc:${kind}:${measuredAt}:${value}`;
  return { kind, value, measuredAt, externalId };
}

/** Kilograms -> grams, the unit the measurements table stores. */
export function weightToMeasurement(record: HealthConnectWeight): ImportedMeasurement | null {
  return toMeasurement("weight", Math.round(record.weight.inKilograms * 1000), record);
}

/** Percent -> tenths of a percent. */
export function bodyFatToMeasurement(record: HealthConnectBodyFat): ImportedMeasurement | null {
  if (record.percentage > 100) return null;
  return toMeasurement("bodyFat", Math.round(record.percentage * 10), record);
}

/** The most recent height in millimetres, or null if there is none or it is implausible. */
export function latestHeightMm(records: HealthConnectHeight[]): number | null {
  let latest: HealthConnectHeight | null = null;
  for (const record of records) {
    if (!latest || Date.parse(record.time) > Date.parse(latest.time)) latest = record;
  }
  if (!latest) return null;
  const mm = Math.round(latest.height.inMeters * 1000);
  return mm >= 500 && mm <= 2800 ? mm : null;
}

/** Start of the time range the next import reads. */
export function importWindowStart(lastImportAt: number | null, now: number): number {
  if (lastImportAt === null) return now - FIRST_IMPORT_DAYS * DAY;
  return lastImportAt - OVERLAP_DAYS * DAY;
}

/** Used when a read from `importWindowStart` is refused for being too old. */
export function fallbackWindowStart(now: number): number {
  return now - FIRST_IMPORT_DAYS * DAY;
}
