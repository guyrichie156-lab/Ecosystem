import { useSyncExternalStore } from "react";
import { SQLiteStorage } from "expo-sqlite/kv-store";

// Kept outside the main database so toggles work even if a module's tables are broken.
const storage = new SQLiteStorage("ecosystem-settings.db");
const cache = new Map<string, boolean>();
const listeners = new Set<() => void>();

const keyFor = (moduleId: string) => `module.${moduleId}.enabled`;

/** Modules are enabled unless the user switched them off. */
export function isModuleEnabled(moduleId: string): boolean {
  let enabled = cache.get(moduleId);
  if (enabled === undefined) {
    enabled = storage.getItemSync(keyFor(moduleId)) !== "false";
    cache.set(moduleId, enabled);
  }
  return enabled;
}

/** Turns a module on or off while the app keeps running; the tab bar and module screens update at once. */
export function setModuleEnabled(moduleId: string, enabled: boolean): void {
  storage.setItemSync(keyFor(moduleId), String(enabled));
  cache.set(moduleId, enabled);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useModuleEnabled(moduleId: string): boolean {
  return useSyncExternalStore(subscribe, () => isModuleEnabled(moduleId));
}

/** Ids of the enabled modules, in the given order. */
export function useEnabledModuleIds(moduleIds: string[]): string[] {
  // A joined string is a stable snapshot: it only changes when a toggle changes.
  const snapshot = useSyncExternalStore(subscribe, () =>
    moduleIds.filter((id) => isModuleEnabled(id)).join("\n")
  );
  return snapshot ? snapshot.split("\n") : [];
}
