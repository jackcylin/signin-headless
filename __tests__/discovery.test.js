import { describe, it, expect } from "vitest";
import { discover } from "../src/discovery.js";

describe("discovery", () => {
  it("constructs the Customer Account API endpoints from the shop id (no network)", () => {
    const d = discover({ shopId: "123" });
    expect(d.authorizationEndpoint).toBe("https://shopify.com/authentication/123/oauth/authorize");
    expect(d.tokenEndpoint).toBe("https://shopify.com/authentication/123/oauth/token");
    expect(d.endSessionEndpoint).toBe("https://shopify.com/authentication/123/logout");
    expect(d.graphqlEndpoint).toMatch(/^https:\/\/shopify\.com\/123\/account\/customer\/api\/.+\/graphql$/);
  });
});
