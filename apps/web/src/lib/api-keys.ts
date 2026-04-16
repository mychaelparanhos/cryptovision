import { randomBytes, createHash } from "crypto";

const API_KEY_PREFIX = "cv_";
const KEY_BYTE_LENGTH = 32;

/**
 * Generate a new API key.
 * Returns the full key (to show once) and the hash + prefix (to store).
 */
export function generateApiKey(): {
  fullKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  const randomPart = randomBytes(KEY_BYTE_LENGTH).toString("hex");
  const fullKey = `${API_KEY_PREFIX}${randomPart}`;
  const keyHash = hashApiKey(fullKey);
  const keyPrefix = fullKey.substring(0, API_KEY_PREFIX.length + 8); // cv_ + 8 chars

  return { fullKey, keyHash, keyPrefix };
}

/**
 * Hash an API key using SHA-256 for storage and lookup.
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Validate that a key has the correct format.
 */
export function isValidApiKeyFormat(key: string): boolean {
  // cv_ + 64 hex chars = 67 total
  return key.startsWith(API_KEY_PREFIX) && key.length === API_KEY_PREFIX.length + KEY_BYTE_LENGTH * 2;
}
