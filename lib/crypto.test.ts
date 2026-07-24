import { test } from "node:test";
import assert from "node:assert/strict";
import { encryptSecret, decryptSecret, maskTail } from "./crypto.ts";

test("encrypt/decrypt round trip", () => {
  const secret = "ya29.a0AfB_byDEMO-token-0123456789";
  const enc = encryptSecret(secret);
  assert.notEqual(enc, secret);
  assert.equal(decryptSecret(enc), secret);
});

test("each encryption uses a fresh IV (no deterministic ciphertext)", () => {
  const a = encryptSecret("same-input");
  const b = encryptSecret("same-input");
  assert.notEqual(a, b);
  assert.equal(decryptSecret(a), decryptSecret(b));
});

test("tampered ciphertext fails authentication", () => {
  const enc = encryptSecret("bkash:01712345678");
  const buf = Buffer.from(enc, "base64");
  buf[buf.length - 1] ^= 0xff; // flip a ciphertext bit
  assert.throws(() => decryptSecret(buf.toString("base64")));
  assert.throws(() => decryptSecret("dG9vc2hvcnQ=")); // too short
});

test("maskTail keeps only the last characters", () => {
  assert.equal(maskTail("01712345678"), "•••••••5678");
  assert.equal(maskTail("123", 4), "•••");
});
