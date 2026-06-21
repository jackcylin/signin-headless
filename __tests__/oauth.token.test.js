import { describe, it, expect, vi } from "vitest";
import { exchangeCode, refreshTokens } from "../src/oauth.js";

const tokenResponse = { access_token: "at", refresh_token: "rt", id_token: "it", expires_in: 3600 };

it("exchangeCode posts grant_type=authorization_code with PKCE verifier", async () => {
  const fetchImpl = vi.fn(async (url, init) => {
    expect(url).toBe("https://t/oauth/token");
    const body = new URLSearchParams(init.body);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("c");
    expect(body.get("code_verifier")).toBe("v");
    expect(body.get("client_id")).toBe("cid");
    return new Response(JSON.stringify(tokenResponse), { status: 200 });
  });
  const t = await exchangeCode({ tokenEndpoint: "https://t/oauth/token", clientId: "cid", code: "c", codeVerifier: "v", redirectUri: "https://s/cb", fetchImpl });
  expect(t.accessToken).toBe("at");
  expect(t.expiresAt).toBeGreaterThan(Date.now());
});

it("refreshTokens posts grant_type=refresh_token", async () => {
  const fetchImpl = vi.fn(async (_url, init) => {
    expect(new URLSearchParams(init.body).get("grant_type")).toBe("refresh_token");
    return new Response(JSON.stringify(tokenResponse), { status: 200 });
  });
  const t = await refreshTokens({ tokenEndpoint: "https://t/oauth/token", clientId: "cid", refreshToken: "old", fetchImpl });
  expect(t.refreshToken).toBe("rt");
});
