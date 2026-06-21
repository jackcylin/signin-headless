import { describe, it, expect, vi } from "vitest";
import { discover } from "../src/discovery.js";

describe("discovery", () => {
  it("reads OIDC discovery + builds the graphql endpoint", async () => {
    const fetchImpl = vi.fn(async (url) => {
      expect(url).toBe("https://shopify.com/authentication/123/.well-known/openid-configuration");
      return new Response(JSON.stringify({
        authorization_endpoint: "https://shopify.com/authentication/123/oauth/authorize",
        token_endpoint: "https://shopify.com/authentication/123/oauth/token",
        end_session_endpoint: "https://shopify.com/authentication/123/logout",
      }), { status: 200 });
    });
    const d = await discover({ shopId: "123", fetchImpl });
    expect(d.authorizationEndpoint).toContain("/oauth/authorize");
    expect(d.tokenEndpoint).toContain("/oauth/token");
    expect(d.graphqlEndpoint).toMatch(/^https:\/\/shopify\.com\/123\/account\/customer\/api\/.+\/graphql$/);
  });
});
