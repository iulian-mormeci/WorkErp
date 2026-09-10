import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 16;

/**
 * `UNOERP_ENCRYPTION_KEY` deve essere una chiave a 32 byte, hex-encoded (64
 * caratteri hex) — generata con `openssl rand -hex 32`. Solo server-side:
 * questo modulo va importato esclusivamente da Route Handler / cron.
 */
function getKey(): Buffer {
  const raw = process.env.UNOERP_ENCRYPTION_KEY;
  if (!raw) throw new Error("UNOERP_ENCRYPTION_KEY is not set");
  const key = Buffer.from(raw, "hex");
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `UNOERP_ENCRYPTION_KEY must decode to ${KEY_LENGTH_BYTES} bytes (got ${key.length}) — generate with "openssl rand -hex 32"`
    );
  }
  return key;
}

export function encryptToken(plaintext: string): { encrypted: string; iv: string } {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return { encrypted: encrypted.toString("hex"), iv: iv.toString("hex") };
}

export function decryptToken(encryptedHex: string, ivHex: string): string {
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}
