/**
 * The backup file, apart from encryption (backup.ts), so it can be tested without a phone.
 *
 * File: "HATA-BACKUP" + one format byte, then the AES-GCM sealed payload (IV, ciphertext, tag).
 * Payload: 4-byte manifest length, the manifest as JSON, then each database file in manifest order.
 */

export const BACKUP_FORMAT = 1;
const MAGIC = "HATA-BACKUP";

export type BackupManifest = {
  format: number;
  /** When the copy was made, ms since 1970. */
  createdAt: number;
  /** How many database migrations the app had applied; a newer copy can't go into an older app. */
  migrations: number;
  databases: { name: string; size: number }[];
};

export type BackupErrorCode = "not-a-backup" | "newer-format" | "wrong-key" | "damaged" | "newer-app";

export class BackupError extends Error {
  constructor(readonly code: BackupErrorCode) {
    super(`Backup: ${code}`);
  }
}

// The manifest is plain ASCII, so no TextEncoder is needed (not every JS engine has one).
function asciiBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 127) throw new Error("Backup manifest must be ASCII");
    bytes[i] = code;
  }
  return bytes;
}

function asciiText(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return text;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

/** The unencrypted start of the file; also bound to the ciphertext as additional data. */
export function backupHeader(format = BACKUP_FORMAT): Uint8Array {
  return concat([asciiBytes(MAGIC), new Uint8Array([format])]);
}

/** Header + sealed payload. */
export function frameBackup(sealed: Uint8Array): Uint8Array {
  return concat([backupHeader(), sealed]);
}

/** The sealed payload of a backup file; throws if the file isn't one this app can read. */
export function unframeBackup(file: Uint8Array): Uint8Array {
  const header = backupHeader();
  const magicLength = header.length - 1;
  if (file.length <= header.length || asciiText(file.subarray(0, magicLength)) !== MAGIC) {
    throw new BackupError("not-a-backup");
  }
  if (file[magicLength] !== BACKUP_FORMAT) throw new BackupError("newer-format");
  return file.subarray(header.length);
}

/** The payload to encrypt: the manifest and the databases' bytes. */
export function packBackup(manifest: Omit<BackupManifest, "databases">, databases: { name: string; bytes: Uint8Array }[]): Uint8Array {
  const json = asciiBytes(
    JSON.stringify({ ...manifest, databases: databases.map((d) => ({ name: d.name, size: d.bytes.length })) })
  );
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, json.length);
  return concat([length, json, ...databases.map((d) => d.bytes)]);
}

/** Reads a decrypted payload back; throws `damaged` if the parts don't add up. */
export function unpackBackup(payload: Uint8Array): { manifest: BackupManifest; databases: Map<string, Uint8Array> } {
  try {
    if (payload.length < 4) throw new Error("short");
    const jsonLength = new DataView(payload.buffer, payload.byteOffset, 4).getUint32(0);
    const manifest = JSON.parse(asciiText(payload.subarray(4, 4 + jsonLength))) as BackupManifest;
    if (!Array.isArray(manifest.databases) || typeof manifest.migrations !== "number") throw new Error("manifest");
    const databases = new Map<string, Uint8Array>();
    let offset = 4 + jsonLength;
    for (const { name, size } of manifest.databases) {
      if (offset + size > payload.length) throw new Error("truncated");
      databases.set(name, payload.subarray(offset, offset + size));
      offset += size;
    }
    if (offset !== payload.length) throw new Error("trailing bytes");
    return { manifest, databases };
  } catch {
    throw new BackupError("damaged");
  }
}

/** 64 hex digits shown as 16 groups of four: "3F9A-…", easier to copy by hand. */
export function formatRecoveryKey(hex: string): string {
  return hex.toUpperCase().match(/.{1,4}/g)!.join("-");
}

/** The 64 hex digits of a typed or pasted key (spaces, dashes and case ignored), or null. */
export function parseRecoveryKey(text: string): string | null {
  const hex = text.replace(/[\s-]/g, "").toLowerCase();
  return /^[0-9a-f]{64}$/.test(hex) ? hex : null;
}
