// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHeadlessAuth } from "../src/auth.js";

const discoveryDoc = {
  authorization_endpoint: "https://shopify.com/authentication/123/oauth/authorize",
  token_endpoint: "https://shopify.com/authentication/123/oauth/token",
  end_session_endpoint: "https://shopify.com/authentication/123/logout",
};
function fakeFetch(routes) {
  return vi.fn(async (url, init) => {
    for (const [match, handler] of routes) if (url.includes(match)) return handler(url, init);
    throw new Error("unrouted: " + url);
  });
}
beforeEach(() => { sessionStorage.clear(); });

it("login navigates to a PKCE authorize URL and persists verifier+state", async () => {
  const fetchImpl = fakeFetch([["openid-configuration", async () => new Response(JSON.stringify(discoveryDoc), { status: 200 })]]);
  let navigated = null;
  const auth = createHeadlessAuth({ shop: "s", clientId: "cid", shopId: "123", redirectUri: "https://shop/cb", fetchImpl });
  auth._navigate = (u) => { navigated = u; };
  await auth.login("google");
  const q = new URL(navigated).searchParams;
  expect(q.get("client_id")).toBe("cid");
  expect(q.get("code_challenge_method")).toBe("S256");
  expect(q.get("login_hint")).toBe("google");
  const saved = JSON.parse(sessionStorage.getItem("hiko:pkce"));
  expect(saved.state).toBe(q.get("state"));
  expect(saved.verifier).toBeTruthy();
});

it("handleCallback validates state, exchanges code, stores tokens", async () => {
  sessionStorage.setItem("hiko:pkce", JSON.stringify({ state: "st", verifier: "ver" }));
  const fetchImpl = fakeFetch([
    ["openid-configuration", async () => new Response(JSON.stringify(discoveryDoc), { status: 200 })],
    ["/oauth/token", async (_u, init) => { expect(new URLSearchParams(init.body).get("code_verifier")).toBe("ver"); return new Response(JSON.stringify({ access_token: "at", refresh_token: "rt", id_token: "it", expires_in: 3600 }), { status: 200 }); }],
  ]);
  const auth = createHeadlessAuth({ shop: "s", clientId: "cid", shopId: "123", redirectUri: "https://shop/cb", fetchImpl });
  auth._getCallbackParams = () => ({ code: "c", state: "st" }); // inject (no real location in jsdom)
  await auth.handleCallback();
  expect(auth.isLoggedIn()).toBe(true);
  expect(sessionStorage.getItem("hiko:pkce")).toBeNull();
});

it("query refreshes once on 401 then retries", async () => {
  let calls = 0;
  const fetchImpl = fakeFetch([
    ["openid-configuration", async () => new Response(JSON.stringify(discoveryDoc), { status: 200 })],
    ["/oauth/token", async () => new Response(JSON.stringify({ access_token: "at2", refresh_token: "rt2", id_token: "it", expires_in: 3600 }), { status: 200 })],
    ["/graphql", async () => { calls++; return calls === 1 ? new Response("{}", { status: 401 }) : new Response(JSON.stringify({ data: { customer: { firstName: "Jo" } } }), { status: 200 }); }],
  ]);
  const auth = createHeadlessAuth({ shop: "s", clientId: "cid", shopId: "123", fetchImpl });
  auth._tokenStore().set({ accessToken: "old", refreshToken: "rt", idToken: "it", expiresAt: Date.now() + 9e5 });
  const data = await auth.query("{ customer { firstName } }");
  expect(data.customer.firstName).toBe("Jo");
  expect(calls).toBe(2);
});

it("handleCallback rejects with state_mismatch when callback state does not match saved PKCE state", async () => {
  // Save a PKCE entry with state "correct-state"
  sessionStorage.setItem("hiko:pkce", JSON.stringify({ state: "correct-state", verifier: "ver" }));
  const fetchImpl = fakeFetch([
    ["openid-configuration", async () => new Response(JSON.stringify(discoveryDoc), { status: 200 })],
  ]);
  const auth = createHeadlessAuth({ shop: "s", clientId: "cid", shopId: "123", redirectUri: "https://shop/cb", fetchImpl });
  // Inject a callback with a DIFFERENT state (CSRF attack scenario)
  auth._getCallbackParams = () => ({ code: "c", state: "tampered-state" });
  await expect(auth.handleCallback()).rejects.toThrow("state_mismatch");
});
