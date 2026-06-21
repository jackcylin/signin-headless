import { describe, it, expect } from "vitest";
import { generateVerifier, challengeFromVerifier, randomString } from "../src/pkce.js";

describe("pkce", () => {
  it("verifier is URL-safe and 43-128 chars", () => {
    const v = generateVerifier();
    expect(v).toMatch(/^[A-Za-z0-9\-._~]{43,128}$/);
  });
  it("challenge is base64url SHA-256 of verifier (deterministic)", async () => {
    const v = "test-verifier-fixed-value-aaaaaaaaaaaaaaaaaaaa";
    const c1 = await challengeFromVerifier(v);
    const c2 = await challengeFromVerifier(v);
    expect(c1).toBe(c2);
    expect(c1).toMatch(/^[A-Za-z0-9\-_]{43}$/); // 256-bit base64url, no padding
  });
  it("randomString is URL-safe and unique", () => {
    expect(randomString()).not.toBe(randomString());
    expect(randomString()).toMatch(/^[A-Za-z0-9\-_]+$/);
  });
});
