import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BackupError,
  formatRecoveryKey,
  frameBackup,
  packBackup,
  parseRecoveryKey,
  unframeBackup,
  unpackBackup,
} from "./backupFormat";

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e instanceof BackupError ? e.code : String(e);
  }
  return "no error";
};

test("the databases come back as they went in, in order", () => {
  const main = new Uint8Array([1, 2, 3, 4, 5]);
  const settings = new Uint8Array([9, 8]);
  const payload = packBackup({ format: 1, createdAt: 1761300000000, migrations: 8 }, [
    { name: "ecosystem.db", bytes: main },
    { name: "ecosystem-settings.db", bytes: settings },
  ]);
  const { manifest, databases } = unpackBackup(payload);
  assert.equal(manifest.migrations, 8);
  assert.deepEqual([...databases.keys()], ["ecosystem.db", "ecosystem-settings.db"]);
  assert.deepEqual(databases.get("ecosystem.db"), main);
  assert.deepEqual(databases.get("ecosystem-settings.db"), settings);
});

test("a cut or padded payload is reported as damaged", () => {
  const payload = packBackup({ format: 1, createdAt: 0, migrations: 1 }, [{ name: "a.db", bytes: new Uint8Array(10) }]);
  assert.equal(code(() => unpackBackup(payload.subarray(0, payload.length - 1))), "damaged");
  assert.equal(code(() => unpackBackup(new Uint8Array([...payload, 0]))), "damaged");
  assert.equal(code(() => unpackBackup(new Uint8Array([0, 0]))), "damaged");
});

test("the file starts with HATA-BACKUP and its format; other files are refused", () => {
  const sealed = new Uint8Array([7, 7, 7]);
  const file = frameBackup(sealed);
  assert.equal(String.fromCharCode(...file.subarray(0, 11)), "HATA-BACKUP");
  assert.deepEqual(unframeBackup(file), sealed);
  assert.equal(code(() => unframeBackup(new Uint8Array([80, 75, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0]))), "not-a-backup");
  const newer = new Uint8Array(file);
  newer[11] = 2;
  assert.equal(code(() => unframeBackup(newer)), "newer-format");
});

test("the recovery key is shown in groups of four and read back however it was typed", () => {
  const hex = "3f9a".repeat(16);
  const shown = formatRecoveryKey(hex);
  assert.equal(shown, Array(16).fill("3F9A").join("-"));
  assert.equal(parseRecoveryKey(shown), hex);
  assert.equal(parseRecoveryKey(` ${shown.toLowerCase().replace(/-/g, " ")} `), hex);
  assert.equal(parseRecoveryKey(shown.slice(0, -1)), null);
  assert.equal(parseRecoveryKey(shown.replace("3F9A", "3F9Z")), null);
});
