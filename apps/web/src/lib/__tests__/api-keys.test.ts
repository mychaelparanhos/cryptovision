import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey, isValidApiKeyFormat } from "../api-keys";

describe("API Key Generation", () => {
  it("generates key with cv_ prefix", () => {
    const { fullKey } = generateApiKey();
    expect(fullKey.startsWith("cv_")).toBe(true);
  });

  it("generates key with correct length (cv_ + 64 hex chars)", () => {
    const { fullKey } = generateApiKey();
    expect(fullKey.length).toBe(3 + 64); // "cv_" + 32 bytes as hex
  });

  it("generates unique keys", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1.fullKey).not.toBe(key2.fullKey);
    expect(key1.keyHash).not.toBe(key2.keyHash);
  });

  it("stores 8-char prefix after cv_", () => {
    const { fullKey, keyPrefix } = generateApiKey();
    expect(keyPrefix).toBe(fullKey.substring(0, 11)); // cv_ + 8 chars
    expect(keyPrefix.length).toBe(11);
  });

  it("hash is consistent for same key", () => {
    const { fullKey, keyHash } = generateApiKey();
    expect(hashApiKey(fullKey)).toBe(keyHash);
  });

  it("hash is different for different keys", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1.keyHash).not.toBe(key2.keyHash);
  });
});

describe("hashApiKey", () => {
  it("produces a 64-char hex string (SHA-256)", () => {
    const hash = hashApiKey("cv_test_key");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", () => {
    const hash1 = hashApiKey("cv_test_key");
    const hash2 = hashApiKey("cv_test_key");
    expect(hash1).toBe(hash2);
  });

  it("different inputs produce different hashes", () => {
    const hash1 = hashApiKey("cv_key_one");
    const hash2 = hashApiKey("cv_key_two");
    expect(hash1).not.toBe(hash2);
  });
});

describe("isValidApiKeyFormat", () => {
  it("returns true for valid key format", () => {
    const { fullKey } = generateApiKey();
    expect(isValidApiKeyFormat(fullKey)).toBe(true);
  });

  it("returns false for key without cv_ prefix", () => {
    expect(isValidApiKeyFormat("sk_" + "a".repeat(64))).toBe(false);
  });

  it("returns false for key that is too short", () => {
    expect(isValidApiKeyFormat("cv_abc123")).toBe(false);
  });

  it("returns false for key that is too long", () => {
    expect(isValidApiKeyFormat("cv_" + "a".repeat(100))).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidApiKeyFormat("")).toBe(false);
  });
});
