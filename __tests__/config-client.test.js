import { describe, it, expect, vi } from "vitest";
import { loadConfig } from "../src/config-client.js";

describe("loadConfig", () => {
  it("fetches /headless/config?shop and returns the payload", async () => {
    const payload = { entitled: true, providers: ["google"], styles: { theme: "light" }, passwordless: { otp: true, passkey: true }, storefront: {}, widgetText: {}, consent: {} };
    const fetchImpl = vi.fn(async (url) => {
      expect(url).toBe("https://signin.hiko.software/headless/config?shop=s.myshopify.com");
      return new Response(JSON.stringify(payload), { status: 200 });
    });
    const cfg = await loadConfig({ configServer: "https://signin.hiko.software", shop: "s.myshopify.com", fetchImpl });
    expect(cfg.providers).toEqual(["google"]);
  });

  it("throws on non-OK", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 500 }));
    await expect(loadConfig({ configServer: "https://signin.hiko.software", shop: "x", fetchImpl })).rejects.toThrow("config_unavailable");
  });
});
