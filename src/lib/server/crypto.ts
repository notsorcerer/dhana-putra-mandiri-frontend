/**
 * Enkripsi terautentikasi (AES-256-GCM) untuk isi cookie sesi & transaksi OAuth.
 * Kunci diturunkan dari SESSION_SECRET via HKDF-SHA256 dengan label terpisah
 * per jenis data, sehingga cookie transaksi tidak bisa dipakai sebagai sesi.
 */

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { authConfig } from "./config";

const keyCache = new Map<string, Buffer>();

function deriveKey(purpose: string): Buffer {
  let key = keyCache.get(purpose);
  if (!key) {
    key = Buffer.from(hkdfSync("sha256", authConfig().sessionSecret, "dpm-bff-v1", purpose, 32));
    keyCache.set(purpose, key);
  }
  return key;
}

export function seal(purpose: string, value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(purpose), iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

export function unseal<T>(purpose: string, sealed: string | undefined | null): T | null {
  if (!sealed) return null;
  try {
    const raw = Buffer.from(sealed, "base64url");
    if (raw.length < 29) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(purpose), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(plaintext.toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
