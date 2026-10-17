// The schema file, not the package root: the root also opens the database, which tests can't do.
import { BODY_MEASUREMENT_KINDS, type BodyMeasurementKind } from "@ecosystem/db/src/schema";

export { BODY_MEASUREMENT_KINDS, type BodyMeasurementKind };

type KindInfo = {
  label: string;
  unit: "кг" | "см";
  /** Stored integer units per displayed unit: grams per kg, millimetres per cm. */
  scale: number;
  /** Plausible range in displayed units, to catch typos like 825 instead of 82,5. */
  min: number;
  max: number;
};

export const KIND_INFO: Record<BodyMeasurementKind, KindInfo> = {
  weight: { label: "Вес", unit: "кг", scale: 1000, min: 20, max: 400 },
  neck: { label: "Шея", unit: "см", scale: 10, min: 20, max: 80 },
  chest: { label: "Грудь", unit: "см", scale: 10, min: 50, max: 200 },
  waist: { label: "Талия", unit: "см", scale: 10, min: 40, max: 250 },
  belly: { label: "Живот", unit: "см", scale: 10, min: 40, max: 250 },
  hips: { label: "Бёдра", unit: "см", scale: 10, min: 50, max: 250 },
  biceps: { label: "Бицепс", unit: "см", scale: 10, min: 15, max: 80 },
  thigh: { label: "Бедро", unit: "см", scale: 10, min: 30, max: 120 },
};

const numberFormat = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Stored integer -> "82,5 кг". */
export function formatMeasurement(kind: BodyMeasurementKind, value: number): string {
  const info = KIND_INFO[kind];
  return `${numberFormat.format(value / info.scale)} ${info.unit}`;
}

/** Signed change for display, e.g. "−1,0 см" or "+0,5 кг". */
export function formatChange(kind: BodyMeasurementKind, delta: number): string {
  const info = KIND_INFO[kind];
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
  return `${sign}${numberFormat.format(Math.abs(delta) / info.scale)} ${info.unit}`;
}

export type ParseResult = { value: number } | { error: string };

/** User input "82,5" -> stored integer, or an error message in Russian. */
export function parseMeasurement(kind: BodyMeasurementKind, input: string): ParseResult {
  const info = KIND_INFO[kind];
  const normalized = input.replace(",", ".").trim();
  if (!/^\d+(\.\d)?$/.test(normalized)) return { error: `${info.label}: число, например 82,5` };
  const displayed = parseFloat(normalized);
  if (displayed < info.min || displayed > info.max) {
    return { error: `${info.label}: от ${info.min} до ${info.max} ${info.unit}` };
  }
  return { value: Math.round(displayed * info.scale) };
}
