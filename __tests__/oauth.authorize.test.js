import { describe, it, expect } from "vitest";
import { buildAuthorizeUrl } from "../src/oauth.js";

it("includes PKCE + standard params", () => {
  const url = new URL(buildAuthorizeUrl({
    authorizationEndpoint: "https://shopify.com/authentication/123/oauth/authorize",
    clientId: "cid", redirectUri: "https://shop.example/cb",
    scope: "openid email customer-account-api:full",
    state: "st", codeChallenge: "cc", providerHint: "google",
  }));
  const q = url.searchParams;
  expect(q.get("response_type")).toBe("code");
  expect(q.get("client_id")).toBe("cid");
  expect(q.get("redirect_uri")).toBe("https://shop.example/cb");
  expect(q.get("state")).toBe("st");
  expect(q.get("code_challenge")).toBe("cc");
  expect(q.get("code_challenge_method")).toBe("S256");
});
