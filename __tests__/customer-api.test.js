import { describe, it, expect, vi } from "vitest";
import { customerQuery } from "../src/customer-api.js";

describe("customerQuery", () => {
  it("POSTs GraphQL with the raw access token header", async () => {
    const fetchImpl = vi.fn(async (url, init) => {
      expect(url).toBe("https://g/graphql");
      expect(init.headers.Authorization).toBe("at"); // NOT "Bearer at"
      expect(JSON.parse(init.body).query).toContain("customer");
      return new Response(JSON.stringify({ data: { customer: { firstName: "Jo" } } }), { status: 200 });
    });
    const data = await customerQuery({ graphqlEndpoint: "https://g/graphql", accessToken: "at", query: "{ customer { firstName } }", fetchImpl });
    expect(data.customer.firstName).toBe("Jo");
  });

  it("throws unauthorized on 401", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 401 }));
    await expect(customerQuery({ graphqlEndpoint: "https://g/graphql", accessToken: "x", query: "{}", fetchImpl })).rejects.toThrow("unauthorized");
  });
});
