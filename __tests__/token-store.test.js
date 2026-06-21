import { describe, it, expect } from "vitest";
import { memoryTokenStore } from "../src/token-store.js";

it("stores, returns, and clears tokens", () => {
  const s = memoryTokenStore();
  expect(s.get()).toBeNull();
  s.set({ accessToken: "a", refreshToken: "r", idToken: "i", expiresAt: 123 });
  expect(s.get()).toEqual({ accessToken: "a", refreshToken: "r", idToken: "i", expiresAt: 123 });
  s.clear();
  expect(s.get()).toBeNull();
});
