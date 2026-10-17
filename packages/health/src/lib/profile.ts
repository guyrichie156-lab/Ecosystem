import { SQLiteStorage } from "expo-sqlite/kv-store";

export type Sex = "male" | "female";

export type HealthProfile = {
  /** Height in millimetres, like the circumferences. */
  heightMm: number | null;
  sex: Sex | null;
};

// Two values don't need a table and a migration; a key-value store is enough.
const storage = new SQLiteStorage("ecosystem-settings.db");
const HEIGHT_KEY = "health.heightMm";
const SEX_KEY = "health.sex";

export function getHealthProfile(): HealthProfile {
  const height = Number(storage.getItemSync(HEIGHT_KEY));
  const sex = storage.getItemSync(SEX_KEY);
  return {
    heightMm: height > 0 ? height : null,
    sex: sex === "male" || sex === "female" ? sex : null,
  };
}

export function saveHealthProfile(profile: HealthProfile): void {
  if (profile.heightMm) storage.setItemSync(HEIGHT_KEY, String(profile.heightMm));
  else storage.removeItemSync(HEIGHT_KEY);
  if (profile.sex) storage.setItemSync(SEX_KEY, profile.sex);
  else storage.removeItemSync(SEX_KEY);
}
