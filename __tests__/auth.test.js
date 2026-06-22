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

// ─── Popup login mode ─────────────────────────────────────────────────────────

describe("popup mode — login()", () => {
  it("calls _openPopup with a /headless/start URL containing shop, return, and provider", () => {
    const auth = createHeadlessAuth({
      shop: SHOP,
      configServer: CS,
      returnUrl: "https://mystore.com/account",
      fetchImpl: vi.fn(),
      mode: "popup",
    });

    const openedUrls = [];
    // Simulate popup that never closes
    const fakePopup = { closed: false };
    auth._openPopup = (url) => { openedUrls.push(url); return fakePopup; };
    auth._navigate = vi.fn();

    auth.login("google");

    expect(openedUrls).toHaveLength(1);
    const url = new URL(openedUrls[0]);
    expect(url.origin + url.pathname).toBe(CS + "/headless/start");
    expect(url.searchParams.get("shop")).toBe(SHOP);
    expect(url.searchParams.get("return")).toBe("https://mystore.com/account");
    expect(url.searchParams.get("provider")).toBe("google");
    // Should NOT have navigated the current page
    expect(auth._navigate).not.toHaveBeenCalled();
  });

  it("ignores messages with wrong origin (forged origin)", async () => {
    const auth = createHeadlessAuth({
      shop: SHOP,
      configServer: CS,
      returnUrl: "https://mystore.com/account",
      fetchImpl: vi.fn(),
      mode: "popup",
    });
    const fakePopup = { closed: false };
    auth._openPopup = () => fakePopup;
    auth._navigate = vi.fn();

    auth.login("google");

    // Simulate a message from a WRONG origin
    const badEvent = new MessageEvent("message", {
      data: { type: "hiko:session", session: "evil-tok", customer: { firstName: "Hacker" } },
      origin: "https://evil.com",
      source: fakePopup,
    });
    window.dispatchEvent(badEvent);

    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.getLastCustomer()).toBeNull();
  });

  it("ignores messages with wrong source (not the popup)", async () => {
    const auth = createHeadlessAuth({
      shop: SHOP,
      configServer: CS,
      returnUrl: "https://mystore.com/account",
      fetchImpl: vi.fn(),
      mode: "popup",
    });
    const fakePopup = { closed: false };
    auth._openPopup = () => fakePopup;
    auth._navigate = vi.fn();

    auth.login("google");

    // Message from correct origin but different source (wrong window)
    const badEvent = new MessageEvent("message", {
      data: { type: "hiko:session", session: "evil-tok", customer: {} },
      origin: location.origin,
      source: window, // not fakePopup
    });
    window.dispatchEvent(badEvent);

    expect(auth.isLoggedIn()).toBe(false);
  });

  it("accepts correct hiko:session message → isLoggedIn and getLastCustomer populated", async () => {
    const auth = createHeadlessAuth({
      shop: SHOP,
      configServer: CS,
      returnUrl: "https://mystore.com/account",
      fetchImpl: vi.fn(),
      mode: "popup",
    });
    const fakePopup = { closed: false };
    auth._openPopup = () => fakePopup;
    auth._navigate = vi.fn();

    const loginFired = [];
    auth.onChange((a) => { if (a.isLoggedIn()) loginFired.push(true); });

    auth.login("google");

    const okEvent = new MessageEvent("message", {
      data: { type: "hiko:session", session: "tok-ok", customer: { firstName: "Jo", emailAddress: { emailAddress: "jo@example.com" } } },
      origin: location.origin,
      source: fakePopup,
    });
    window.dispatchEvent(okEvent);

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.getLastCustomer()).toMatchObject({ firstName: "Jo" });
    expect(loginFired).toHaveLength(1);
  });

  it("falls back to _navigate when _openPopup returns null (popup blocked)", () => {
    const auth = createHeadlessAuth({
      shop: SHOP,
      configServer: CS,
      returnUrl: "https://mystore.com/account",
      fetchImpl: vi.fn(),
      mode: "popup",
    });
    auth._openPopup = () => null; // blocked
    const navigated = [];
    auth._navigate = (u) => navigated.push(u);

    auth.login("google");

    expect(navigated).toHaveLength(1);
    const url = new URL(navigated[0]);
    expect(url.pathname).toBe("/headless/start");
  });

  it("default mode (no mode param) still uses _navigate (redirect unchanged)", () => {
    const auth = createHeadlessAuth({
      shop: SHOP,
      configServer: CS,
      returnUrl: "https://mystore.com/account",
      fetchImpl: vi.fn(),
      // no mode
    });
    const openedUrls = [];
    auth._openPopup = (u) => { openedUrls.push(u); return { closed: false }; };
    const navigated = [];
    auth._navigate = (u) => navigated.push(u);

    auth.login("google");

    expect(openedUrls).toHaveLength(0);
    expect(navigated).toHaveLength(1);
  });
});

describe("popup mode — isPopupCallback() and completePopupCallback()", () => {
  it("isPopupCallback() returns true when _isPopup is true and hash has hiko_session", () => {
    const auth = createHeadlessAuth({ shop: SHOP, configServer: CS, fetchImpl: vi.fn(), mode: "popup" });
    auth._isPopup = () => true;
    auth._getHash = () => "#hiko_session=tok123";

    expect(auth.isPopupCallback()).toBe(true);
  });

  it("isPopupCallback() returns false when not in popup window", () => {
    const auth = createHeadlessAuth({ shop: SHOP, configServer: CS, fetchImpl: vi.fn(), mode: "popup" });
    auth._isPopup = () => false;
    auth._getHash = () => "#hiko_session=tok123";

    expect(auth.isPopupCallback()).toBe(false);
  });

  it("isPopupCallback() returns false when no pending callback hash", () => {
    const auth = createHeadlessAuth({ shop: SHOP, configServer: CS, fetchImpl: vi.fn(), mode: "popup" });
    auth._isPopup = () => true;
    auth._getHash = () => "";

    expect(auth.isPopupCallback()).toBe(false);
  });

  it("completePopupCallback() with valid session: posts {type:hiko:session} to opener and closes self", async () => {
    const fetchImpl = makeFetch([
      ["/headless/token", async () =>
        new Response(JSON.stringify({ accessToken: "ca-tok", expiresAt: "2027-01-01T00:00:00Z" }), { status: 200 })],
      ["/headless/customer", async () =>
        new Response(JSON.stringify({ data: { customer: { firstName: "Sam" } } }), { status: 200 })],
    ]);

    const auth = createHeadlessAuth({ shop: SHOP, configServer: CS, fetchImpl, mode: "popup" });
    auth._isPopup = () => true;
    auth._getHash = () => "#hiko_session=popup-tok";
    const postedMessages = [];
    auth._postToOpener = (msg) => postedMessages.push(msg);
    const closedSelf = [];
    auth._closeSelf = () => closedSelf.push(true);

    await auth.completePopupCallback();

    expect(postedMessages).toHaveLength(1);
    const msg = postedMessages[0];
    expect(msg.type).toBe("hiko:session");
    expect(msg.session).toBe("popup-tok");
    expect(msg.accessToken).toBe("ca-tok");
    expect(msg.customer).toMatchObject({ firstName: "Sam" });
    expect(closedSelf).toHaveLength(1);
  });

  it("completePopupCallback() when handleCallback fails: posts hiko:error and closes self", async () => {
    const auth = createHeadlessAuth({ shop: SHOP, configServer: CS, fetchImpl: vi.fn(), mode: "popup" });
    auth._isPopup = () => true;
    auth._getHash = () => ""; // no hiko_session → handleCallback returns false

    const postedMessages = [];
    auth._postToOpener = (msg) => postedMessages.push(msg);
    const closedSelf = [];
    auth._closeSelf = () => closedSelf.push(true);

    await auth.completePopupCallback();

    expect(postedMessages).toHaveLength(1);
    expect(postedMessages[0].type).toBe("hiko:error");
    expect(closedSelf).toHaveLength(1);
  });
});

describe("getLastCustomer()", () => {
  it("returns null before any popup login", () => {
    const auth = createHeadlessAuth({ shop: SHOP, fetchImpl: vi.fn() });
    expect(auth.getLastCustomer()).toBeNull();
  });
});

// ─── Popup login regression tests (security & robustness) ─────────────────────

describe("popup login — post-success replay rejection", () => {
  it("rejects a second hiko:session message from the same source after first accept (listener removed)", () => {
    const auth = createHeadlessAuth({
      shop: SHOP,
      configServer: CS,
      returnUrl: "https://mystore.com/account",
      fetchImpl: vi.fn(),
      mode: "popup",
    });
    const fakePopup = { closed: false };
    auth._openPopup = () => fakePopup;
    auth._navigate = vi.fn();

    auth.login("google");

    // First message: accepted
    const event1 = new MessageEvent("message", {
      data: { type: "hiko:session", session: "tok1", customer: { firstName: "A" } },
      origin: location.origin,
      source: fakePopup,
    });
    window.dispatchEvent(event1);

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.getLastCustomer()).toMatchObject({ firstName: "A" });

    // Second message: same source, different session (replay attempt)
    const event2 = new MessageEvent("message", {
      data: { type: "hiko:session", session: "tok2", customer: { firstName: "B" } },
      origin: location.origin,
      source: fakePopup,
    });
    window.dispatchEvent(event2);

    // State must NOT change — listener was removed on first accept
    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.getLastCustomer()).toMatchObject({ firstName: "A" });
  });
});

describe("popup login — poll-cleanup on user close", () => {
  it("cleans up listeners and intervals when popup is closed by user without completing", async () => {
    vi.useFakeTimers();
    try {
      const auth = createHeadlessAuth({
        shop: SHOP,
        configServer: CS,
        returnUrl: "https://mystore.com/account",
        fetchImpl: vi.fn(),
        mode: "popup",
      });
      const fakePopup = { closed: false };
      auth._openPopup = () => fakePopup;
      auth._navigate = vi.fn();

      auth.login("google");

      // Simulate user closing the popup (without sending a message)
      fakePopup.closed = true;

      // Advance timers to trigger the poll check
      vi.advanceTimersByTime(500);

      // After cleanup, a subsequent message should be ignored (listener removed)
      const event = new MessageEvent("message", {
        data: { type: "hiko:session", session: "tok-after-close", customer: { firstName: "Late" } },
        origin: location.origin,
        source: fakePopup,
      });
      window.dispatchEvent(event);

      // State must not change because listener was removed
      expect(auth.isLoggedIn()).toBe(false);
      expect(auth.getLastCustomer()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
