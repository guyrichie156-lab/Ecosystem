// Android implementation; the same exports as healthConnect.ts (used on iOS and web).
import { Linking } from "react-native";
import {
  SdkAvailabilityStatus,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  readRecords,
  requestPermission,
  type Permission,
} from "react-native-health-connect";
import type { HealthConnectData, HealthConnectStatus } from "./healthConnectTypes";

type ImportedType = "Weight" | "BodyFat" | "Height";
const IMPORTED_TYPES: ImportedType[] = ["Weight", "BodyFat", "Height"];
const READ_PERMISSIONS: Permission[] = IMPORTED_TYPES.map((recordType) => ({ accessType: "read", recordType }));

// The Health Connect app's id on Google Play (needed on Android 13 and lower).
const HEALTH_CONNECT_PACKAGE = "com.google.android.apps.healthdata";

let initialized = false;
async function ensureInitialized(): Promise<boolean> {
  if (!initialized) initialized = await initialize();
  return initialized;
}

async function grantedTypes(): Promise<Set<ImportedType>> {
  const granted = await getGrantedPermissions();
  return new Set(
    granted
      .filter((p): p is Permission => "recordType" in p && p.accessType === "read")
      .map((p) => p.recordType)
      .filter((t): t is ImportedType => (IMPORTED_TYPES as string[]).includes(t))
  );
}

export async function getHealthConnectStatus(): Promise<HealthConnectStatus> {
  const sdk = await getSdkStatus();
  if (sdk === SdkAvailabilityStatus.SDK_UNAVAILABLE) return "not_installed";
  if (sdk === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return "update_required";
  if (!(await ensureInitialized())) return "not_installed";
  return (await grantedTypes()).size > 0 ? "connected" : "no_permission";
}

/** Shows Health Connect's permission screen; true if at least one type may now be read. */
export async function requestHealthConnectAccess(): Promise<boolean> {
  if (!(await ensureInitialized())) return false;
  await requestPermission(READ_PERMISSIONS);
  return (await grantedTypes()).size > 0;
}

async function readAll<T extends ImportedType>(recordType: T, startTime: number, endTime: number) {
  const records = [];
  let pageToken: string | undefined;
  do {
    const page = await readRecords(recordType, {
      timeRangeFilter: {
        operator: "between",
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      },
      pageToken,
    });
    records.push(...page.records);
    pageToken = page.pageToken || undefined;
  } while (pageToken);
  return records;
}

/** Reads only the types the user allowed; reading a type without permission throws. */
export async function readHealthConnectData(startTime: number, endTime: number): Promise<HealthConnectData> {
  if (!(await ensureInitialized())) return { weights: [], bodyFats: [], heights: [] };
  const types = await grantedTypes();
  const [weights, bodyFats, heights] = await Promise.all([
    types.has("Weight") ? readAll("Weight", startTime, endTime) : [],
    types.has("BodyFat") ? readAll("BodyFat", startTime, endTime) : [],
    types.has("Height") ? readAll("Height", startTime, endTime) : [],
  ]);
  return { weights, bodyFats, heights };
}

export function openHealthConnectInStore(): void {
  Linking.openURL(`market://details?id=${HEALTH_CONNECT_PACKAGE}`).catch(() =>
    Linking.openURL(`https://play.google.com/store/apps/details?id=${HEALTH_CONNECT_PACKAGE}`)
  );
}
