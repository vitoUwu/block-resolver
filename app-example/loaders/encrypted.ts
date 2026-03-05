import { decryptFromHex, hasLocalCryptoKey } from "../utils/crypto";

interface Props {
  encrypted?: string;
  name?: string;
  value?: string;
}

let didShowWarning = false;

function warnMissingKeyOnce() {
  if (didShowWarning) return;
  didShowWarning = true;
  console.warn(
    "APP_EXAMPLE_CRYPTO_KEY is not set. Encrypted values cannot be decrypted.",
  );
}

export default async function encryptedLoader(props: Props): Promise<string | null> {
  if (props.name && process.env[props.name]) {
    return process.env[props.name] ?? null;
  }

  if (props.value) {
    return props.value;
  }

  if (!props.encrypted) {
    return null;
  }

  if (!hasLocalCryptoKey()) {
    warnMissingKeyOnce();
    return null;
  }

  try {
    return await decryptFromHex(props.encrypted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown decrypt error";
    console.error(`Could not decrypt secret "${props.name ?? "anonymous"}": ${message}`);
    return null;
  }
}
