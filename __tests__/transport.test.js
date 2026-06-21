import { describe, it, expect, vi } from "vitest";
import { createHeadlessTransport } from "../src/transport.js";

it("maps widget transport calls to the SDK", async () => {
  const auth = { loadConfig: vi.fn(async () => ({ providers: ["google"] })), login: vi.fn(async () => {}) };
  const t = createHeadlessTransport(auth);
  expect((await t.getConfig()).providers).toEqual(["google"]);
  await t.selectSocial("google");
  expect(auth.login).toHaveBeenCalledWith("google");
  await t.selectEmail("a@b.c");
  expect(auth.login).toHaveBeenCalledWith();
});

it("selectSocial resolves to {} and calls auth.login with the provider", async () => {
  const auth = { login: vi.fn(async () => {}), loadConfig: vi.fn() };
  const t = createHeadlessTransport(auth);
  const result = await t.selectSocial("google");
  expect(auth.login).toHaveBeenCalledWith("google");
  expect(result).toEqual({});
});
