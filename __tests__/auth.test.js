// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHeadlessAuth } from "../src/auth.js";

const CS = "https://signin.hiko.software";
const SHOP = "mystore.myshopify.com";

function makeFetch(routes) {
  return vi.fn(async (url, init) => {
    for (const [match, handler] of routes) {
      if (url.includes(match)) return handler(url, init);
    }
    throw new Error("unrouted: " + url);
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

it("login navigates to /headless/start with shop, return, and provider params", () => {
  let navigated = null;
  const auth = createHeadlessAuth({
    shop: SHOP,
    configServer: CS,
    returnUrl: "https://mystore.com/account",
    fetchImpl: vi.fn(),
  });
  auth._navigate = (u) => { navigated = u; };

  auth.login("google");

  expect(navigated).not.toBeNull();
  const url = new URL(navigated);
  expect(url.origin + url.pathname).toBe(CS + "/headless/start");
  expect(url.searchParams.get("shop")).toBe(SHOP);
  expect(url.searchParams.get("return")).toBe("https://mystore.com/account");
  expect(url.searchParams.get("provider")).toBe("google");
});

it("login without provider omits provider param", () => {
  let navigated = null;
  const auth = createHeadlessAuth({
    shop: SHOP,
    configServer: CS,
    returnUrl: "https://mystore.com/account",
    fetchImpl: vi.fn(),
  });
  auth._navigate = (u) => { navigated = u; };

  auth.login();

  const url = new URL(navigated);
  expect(url.searchParams.has("provider")).toBe(false);
});

it("hasPendingCallback returns true when hash contains hiko_session=", () => {
  const auth = createHeadlessAuth({ shop: SHOP, fetchImpl: vi.fn() });
  auth._getHash = () => "#hiko_session=tok123";
  expect(auth.hasPendingCallback()).toBe(true);
});

it("hasPendingCallback returns false when hash is empty", () => {
  const auth = createHeadlessAuth({ shop: SHOP, fetchImpl: vi.fn() });
  auth._getHash = () => "";
  expect(auth.hasPendingCallback()).toBe(false);
});

it("handleCallback stores token and returns true when hiko_session in hash", () => {
  const replaceState = vi.spyOn(history, "replaceState");
  const auth = createHeadlessAuth({ shop: SHOP, fetchImpl: vi.fn() });
  auth._getHash = () => "#hiko_session=tok123";

  const result = auth.handleCallback();

  expect(result).toBe(true);
  expect(auth.isLoggedIn()).toBe(true);
  expect(replaceState).toHaveBeenCalledWith(null, "", expect.not.stringContaining("hiko_session"));
});

it("handleCallback returns false when no hiko_session in hash", () => {
  const auth = createHeadlessAuth({ shop: SHOP, fetchImpl: vi.fn() });
  auth._getHash = () => "#other=stuff";

  const result = auth.handleCallback();

  expect(result).toBe(false);
  expect(auth.isLoggedIn()).toBe(false);
});

it("handleCallback emits onChange when token stored", () => {
  const auth = createHeadlessAuth({ shop: SHOP, fetchImpl: vi.fn() });
  auth._getHash = () => "#hiko_session=tok123";
  const cb = vi.fn();
  auth.onChange(cb);

  auth.handleCallback();

  expect(cb).toHaveBeenCalledOnce();
});

it("query POSTs to /headless/customer with Authorization bearer and returns .data", async () => {
  const fetchImpl = makeFetch([
    ["/headless/customer", async (_url, init) => {
      expect(init.headers["Authorization"]).toBe("Bearer tok123");
      return new Response(JSON.stringify({ data: { customer: { firstName: "Jo" } } }), { status: 200 });
    }],
  ]);
  const auth = createHeadlessAuth({ shop: SHOP, configServer: CS, fetchImpl });
  auth._getHash = () => "#hiko_session=tok123";
  auth.handleCallback();

  const data = await auth.query("{ customer { firstName } }");

  expect(data.customer.firstName).toBe("Jo");
  const [url, init] = fetchImpl.mock.calls[0];
  expect(url).toBe(CS + "/headless/customer");
  expect(init.method).toBe("POST");
});

it("query on 401 clears token, emits, and throws unauthorized", async () => {
  const fetchImpl = makeFetch([
    ["/headless/customer", async () => new Response("{}", { status: 401 })],
  ]);
  const auth = createHeadlessAuth({ shop: SHOP, configServer: CS, fetchImpl });
  auth._getHash = () => "#hiko_session=tok123";
  auth.handleCallback();

  const cb = vi.fn();
  auth.onChange(cb);

  await expect(auth.query("{ customer { firstName } }")).rejects.toThrow("unauthorized");
  expect(auth.isLoggedIn()).toBe(false);
  expect(cb).toHaveBeenCalledOnce();
});

it("logout POSTs to /headless/logout with bearer and clears token", async () => {
  const fetchImpl = makeFetch([
    ["/headless/logout", async (_url, init) => {
      expect(init.headers["Authorization"]).toBe("Bearer tok123");
      return new Response("{}", { status: 200 });
    }],
  ]);
  const auth = createHeadlessAuth({ shop: SHOP, configServer: CS, fetchImpl });
  auth._getHash = () => "#hiko_session=tok123";
  auth.handleCallback();

  expect(auth.isLoggedIn()).toBe(true);
  await auth.logout();
  expect(auth.isLoggedIn()).toBe(false);
});

it("logout emits onChange after clearing token", async () => {
  const fetchImpl = makeFetch([
    ["/headless/logout", async () => new Response("{}", { status: 200 })],
  ]);
  const auth = createHeadlessAuth({ shop: SHOP, configServer: CS, fetchImpl });
  auth._getHash = () => "#hiko_session=tok123";
  auth.handleCallback();

  const cb = vi.fn();
  auth.onChange(cb);
  await auth.logout();

  expect(cb).toHaveBeenCalledOnce();
});

it("session GETs /headless/session with bearer and returns {loggedIn}", async () => {
  const fetchImpl = makeFetch([
    ["/headless/session", async (_url, init) => {
      expect(init.headers["Authorization"]).toBe("Bearer tok123");
      return new Response(JSON.stringify({ loggedIn: true }), { status: 200 });
    }],
  ]);
  const auth = createHeadlessAuth({ shop: SHOP, configServer: CS, fetchImpl });
  auth._getHash = () => "#hiko_session=tok123";
  auth.handleCallback();

  const result = await auth.session();
  expect(result.loggedIn).toBe(true);
});

it("onChange returns unsubscribe function", () => {
  const auth = createHeadlessAuth({ shop: SHOP, fetchImpl: vi.fn() });
  auth._getHash = () => "#hiko_session=tok123";

  const cb = vi.fn();
  const unsub = auth.onChange(cb);
  unsub();

  auth.handleCallback();
  expect(cb).not.toHaveBeenCalled();
});

it("isLoggedIn returns false before handleCallback", () => {
  const auth = createHeadlessAuth({ shop: SHOP, fetchImpl: vi.fn() });
  expect(auth.isLoggedIn()).toBe(false);
});

describe("getToken()", () => {
  it("GETs /headless/token with Authorization header and returns {accessToken, expiresAt}", async () => {
    const fetchImpl = makeFetch([
      ["/headless/token", async (_url, init) => {
        expect(init.headers["Authorization"]).toBe("Bearer tok123");
        return new Response(JSON.stringify({ accessToken: "ca-tok-abc", expiresAt: "2026-12-31T00:00:00Z" }), { status: 200 });
      }],
    ]);
    const auth = createHeadlessAuth({ shop: SHOP, configServer: CS, fetchImpl });
    auth._getHash = () => "#hiko_session=tok123";
    auth.handleCallback();

    const result = await auth.getToken();

    expect(result.accessToken).toBe("ca-tok-abc");
    expect(result.expiresAt).toBe("2026-12-31T00:00:00Z");
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(CS + "/headless/token");
    expect(init.headers["Authorization"]).toBe("Bearer tok123");
  });

  it("on 401 clears token, emits, and throws 'unauthorized'", async () => {
    const fetchImpl = makeFetch([
      ["/headless/token", async () => new Response("{}", { status: 401 })],
    ]);
    const auth = createHeadlessAuth({ shop: SHOP, configServer: CS, fetchImpl });
    auth._getHash = () => "#hiko_session=tok123";
    auth.handleCallback();

    const cb = vi.fn();
    auth.onChange(cb);

    await expect(auth.getToken()).rejects.toThrow("unauthorized");
    expect(auth.isLoggedIn()).toBe(false);
    expect(cb).toHaveBeenCalledOnce();
  });

  it("when not logged in returns null", async () => {
    const fetchImpl = vi.fn();
    const auth = createHeadlessAuth({ shop: SHOP, configServer: CS, fetchImpl });
    // No handleCallback — token is null

    const result = await auth.getToken();

    expect(result).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
