// iOS and web: Health Connect is Android-only. Metro picks healthConnect.android.ts on Android, so the
// native library (which looks up its native module as soon as it is imported) never loads here.
import type { HealthConnectData, HealthConnectStatus } from "./healthConnectTypes";

export async function getHealthConnectStatus(): Promise<HealthConnectStatus> {
  return "unsupported";
}

export async function requestHealthConnectAccess(): Promise<boolean> {
  return false;
}

export async function readHealthConnectData(_startTime: number, _endTime: number): Promise<HealthConnectData> {
  return { weights: [], bodyFats: [], heights: [] };
}

export function openHealthConnectInStore(): void {}
