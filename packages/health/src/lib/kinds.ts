// The schema file, not the package root: the root also opens the database, which tests can't do.
import { BODY_MEASUREMENT_KINDS, type BodyMeasurementKind } from "@ecosystem/db/src/schema";

export { BODY_MEASUREMENT_KINDS, type BodyMeasurementKind };

/**
 * Measurements the app asks for and shows: only weight since 2026-10-20 (the user dropped body fat and
 * waist). Rows of the other kinds stay in the database, unseen, so they can come back.
 */
export const ACTIVE_KINDS = ["weight"] as const satisfies readonly BodyMeasurementKind[];

type KindInfo = {
  label: string;
  unit: "кг" | "см" | "%";
  /** Stored integer units per displayed unit: grams per kg, tenths per percent, millimetres per cm. */
  scale: number;
  /** Plausible range in displayed units, to catch typos like 825 instead of 82,5. */
  min: number;
  max: number;
  /** Placeholder for the input. */
  example: string;
};

export const KIND_INFO: Record<BodyMeasurementKind, KindInfo> = {
  weight: { label: "Вес", unit: "кг", scale: 1000, min: 20, max: 400, example: "например, 82,5" },
  bodyFat: { label: "Процент жира", unit: "%", scale: 10, min: 2, max: 75, example: "например, 18,5" },
  neck: { label: "Шея", unit: "см", scale: 10, min: 20, max: 80, example: "например, 38" },
  chest: { label: "Грудь", unit: "см", scale: 10, min: 50, max: 200, example: "например, 100" },
  waist: { label: "Талия", unit: "см", scale: 10, min: 40, max: 250, example: "например, 84" },
  belly: { label: "Живот", unit: "см", scale: 10, min: 40, max: 250, example: "например, 90" },
  hips: { label: "Обхват бёдер", unit: "см", scale: 10, min: 50, max: 250, example: "например, 100" },
  biceps: { label: "Бицепс", unit: "см", scale: 10, min: 15, max: 80, example: "например, 35" },
  thigh: { label: "Обхват ноги", unit: "см", scale: 10, min: 30, max: 120, example: "например, 58" },
};

/** "Вес, кг" — the label with its unit, for inputs and headings. */
export function labelWithUnit(kind: BodyMeasurementKind): string {
  return `${KIND_INFO[kind].label}, ${KIND_INFO[kind].unit}`;
}

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
