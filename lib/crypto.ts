/**
 * At-rest encryption for small secrets (OAuth tokens, NID number) —
 * AES-256-GCM, key from TOKEN_KEY (32-byte base64). The SAME code path runs
 * in stub mode: without TOKEN_KEY a fixed dev key is derived (with a loud
 * warning) so `.data/db.json` still holds ciphertext, never plaintext.
 *
 * Format: base64(iv[12] · authTag[16] · ciphertext).
 *
 * Server-only by construction: the node:crypto import fails client bundling,
 * so this module can never leak into a client component. (No "server-only"
 * marker so the pure functions stay unit-testable under `node --test`.)
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const DEV_KEY_SEED = "klipr-dev-token-key-not-for-production";
let warned = false;

function key(): Buffer {
  const raw = process.env.TOKEN_KEY;
  if (raw) {
    const buf = Buffer.from(raw, "base64");
    if (buf.length !== 32) {
      throw new Error("TOKEN_KEY must be 32 bytes of base64 (openssl rand -base64 32)");
    }
    return buf;
  }
  if (!warned && process.env.NODE_ENV === "production") {
    console.warn("[crypto] TOKEN_KEY is not set — using the fixed dev key. DO NOT run production like this.");
    warned = true;
  }
  return createHash("sha256").update(DEV_KEY_SEED).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  if (buf.length < 12 + 16 + 1) throw new Error("ciphertext too short");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** Mask a sensitive number for display: keep the last 4 characters. */
export function maskTail(value: string, visible = 4): string {
  if (value.length <= visible) return "•".repeat(value.length);
  return "•".repeat(value.length - visible) + value.slice(-visible);
}
