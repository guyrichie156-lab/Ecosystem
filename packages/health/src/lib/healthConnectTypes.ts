import type { HealthConnectBodyFat, HealthConnectHeight, HealthConnectWeight } from "./healthConnectMapping";

/**
 * - `unsupported`: not Android (iPhone needs HealthKit, the web has neither).
 * - `not_installed` / `update_required`: Android 13 and lower need the Health Connect app from Google Play.
 * - `no_permission`: available, but the user hasn't allowed reading weight, body fat or height.
 * - `connected`: at least one of them may be read.
 */
export type HealthConnectStatus = "unsupported" | "not_installed" | "update_required" | "no_permission" | "connected";

export type HealthConnectData = {
  weights: HealthConnectWeight[];
  bodyFats: HealthConnectBodyFat[];
  heights: HealthConnectHeight[];
};
