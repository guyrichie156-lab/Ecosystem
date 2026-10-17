import { asc, eq, sql } from "drizzle-orm";
import { db, bodyMeasurements, type BodyMeasurementKind } from "@ecosystem/db";

/** Saves one check-in: every given value gets the same timestamp. */
export async function addCheckIn(values: Partial<Record<BodyMeasurementKind, number>>): Promise<void> {
  const measuredAt = Date.now();
  const rows = Object.entries(values).map(([kind, value]) => ({
    kind: kind as BodyMeasurementKind,
    value: value!,
    measuredAt,
  }));
  if (rows.length > 0) await db.insert(bodyMeasurements).values(rows);
}

export type LatestMeasurement = {
  kind: BodyMeasurementKind;
  value: number;
  measuredAt: number;
  /** The value before the latest one, if there is one. */
  previous: number | null;
};

/** Latest and previous value of every zone that has at least one measurement. */
export async function getLatestMeasurements(): Promise<LatestMeasurement[]> {
  // Rank each zone's rows newest first; ranks 1 and 2 are all the summary needs.
  const rows = await db.all<{ kind: BodyMeasurementKind; value: number; measured_at: number; rank: number }>(sql`
    SELECT kind, value, measured_at, rank FROM (
      SELECT kind, value, measured_at,
        ROW_NUMBER() OVER (PARTITION BY kind ORDER BY measured_at DESC, id DESC) AS rank
      FROM body_measurements
    )
    WHERE rank <= 2
  `);
  const latest = new Map<BodyMeasurementKind, LatestMeasurement>();
  for (const row of rows.filter((r) => r.rank === 1)) {
    latest.set(row.kind, { kind: row.kind, value: row.value, measuredAt: row.measured_at, previous: null });
  }
  for (const row of rows.filter((r) => r.rank === 2)) {
    const entry = latest.get(row.kind);
    if (entry) entry.previous = row.value;
  }
  return [...latest.values()];
}

/** Every value of one zone, oldest first (the order a chart draws them). */
export async function getMeasurementSeries(kind: BodyMeasurementKind) {
  return db
    .select({ id: bodyMeasurements.id, value: bodyMeasurements.value, measuredAt: bodyMeasurements.measuredAt })
    .from(bodyMeasurements)
    .where(eq(bodyMeasurements.kind, kind))
    .orderBy(asc(bodyMeasurements.measuredAt), asc(bodyMeasurements.id));
}

export type MeasurementPoint = Awaited<ReturnType<typeof getMeasurementSeries>>[number];

export async function deleteMeasurement(id: number): Promise<void> {
  await db.delete(bodyMeasurements).where(eq(bodyMeasurements.id, id));
}
