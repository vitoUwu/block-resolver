const CRYPTO_KEY_ENV = "APP_EXAMPLE_CRYPTO_KEY";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex input length.");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function getRawKey(): string | null {
  const value = process.env[CRYPTO_KEY_ENV];
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function deriveAesKey(rawKey: string): Promise<CryptoKey> {
  const encoded = new TextEncoder().encode(rawKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return await crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export function hasLocalCryptoKey(): boolean {
  return getRawKey() !== null;
}

export async function encryptToHex(value: string): Promise<string> {
  const rawKey = getRawKey();
  if (!rawKey) {
    throw new Error(`${CRYPTO_KEY_ENV} is not set.`);
  }

  const key = await deriveAesKey(rawKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(value);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  );

  return `${bytesToHex(iv)}:${bytesToHex(new Uint8Array(ciphertext))}`;
}

export async function decryptFromHex(encrypted: string): Promise<string> {
  const rawKey = getRawKey();
  if (!rawKey) {
    throw new Error(`${CRYPTO_KEY_ENV} is not set.`);
  }

  const [ivHex, dataHex] = encrypted.split(":");
  if (!ivHex || !dataHex) {
    throw new Error("Encrypted value must be formatted as '<ivHex>:<cipherHex>'.");
  }

  const iv = hexToBytes(ivHex);
  const data = hexToBytes(dataHex);
  const key = await deriveAesKey(rawKey);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );
  return new TextDecoder().decode(decrypted);
}
