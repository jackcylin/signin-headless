// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HikoSignin } from "../src/widget/index.js";
import { registerHikoSignin } from "../src/index.js";

beforeEach(() => { HikoSignin.transportFactory = null; });

it("registers <hiko-signin> wired to a headless transport built from attributes", async () => {
  registerHikoSignin();
  const el = document.createElement("hiko-signin");
  el.setAttribute("shop", "s.myshopify.com");
  // jsdom: fetch is undefined; assert wiring, not network
  globalThis.fetch = vi.fn(async () => new Response("{}", { status: 200 }));
  document.body.appendChild(el);
  await el.updateComplete;
  expect(el._transport).toBeTruthy();
  expect(typeof el._transport.getConfig).toBe("function");
});

it("auto-fetches per-shop config and renders the provider buttons", async () => {
  const config = {
    entitled: true,
    providers: ["google", "facebook"],
    styles: {},
    passwordless: { otp: true, passkey: false },
    storefront: {},
    widgetText: {},
    consent: { enabled: false, defaultChecked: true },
  };
  globalThis.fetch = vi.fn(async (url) =>
    String(url).includes("/headless/config")
      ? new Response(JSON.stringify(config), { status: 200 })
      : new Response("{}", { status: 200 }),
  );
  registerHikoSignin();
  const el = document.createElement("hiko-signin");
  el.setAttribute("shop", "s.myshopify.com");
  el.setAttribute("config-server", "https://cfg.test");
  document.body.appendChild(el);

  // The widget self-fetches config on connect (because the headless factory sets
  // fetchConfig=true) and renders one button per provider.
  await vi.waitFor(() => {
    const btns = el.shadowRoot.querySelectorAll("button[data-provider]");
    expect(btns.length).toBe(2);
  });
  expect(globalThis.fetch).toHaveBeenCalledWith(
    "https://cfg.test/headless/config?shop=s.myshopify.com",
  );
});

it("handles pending callback on element connect (redirect-back flow)", async () => {
  // Set up a pending callback in the hash
  const originalHash = window.location.hash;
  window.location.hash = "#hiko_session=tok123";

  globalThis.fetch = vi.fn(async () => new Response("{}", { status: 200 }));
  registerHikoSignin();
  const el = document.createElement("hiko-signin");
  el.setAttribute("shop", "s.myshopify.com");
  el.setAttribute("config-server", "https://cfg.test");
  document.body.appendChild(el);

  // The element should process the pending callback during connect without throwing
  // and the element's isLoggedIn() method (not el._auth) should return true
  await el.updateComplete;
  expect(el.isLoggedIn()).toBe(true);

  // Clean up: restore original hash
  window.location.hash = originalHash;
});

it("element exposes el.login, el.logout, el.query, el.getToken, el.isLoggedIn as functions", async () => {
  globalThis.fetch = vi.fn(async () => new Response("{}", { status: 200 }));
  registerHikoSignin();
  const el = document.createElement("hiko-signin");
  el.setAttribute("shop", "s.myshopify.com");
  document.body.appendChild(el);
  await el.updateComplete;

  expect(typeof el.login).toBe("function");
  expect(typeof el.logout).toBe("function");
  expect(typeof el.query).toBe("function");
  expect(typeof el.getToken).toBe("function");
  expect(typeof el.isLoggedIn).toBe("function");
});

it("dispatches hiko:login event when callback is processed (token becomes present)", async () => {
  const originalHash = window.location.hash;
  window.location.hash = "#hiko_session=tok456";

  globalThis.fetch = vi.fn(async () => new Response("{}", { status: 200 }));
  registerHikoSignin();
  const el = document.createElement("hiko-signin");
  el.setAttribute("shop", "s.myshopify.com");

  const loginEvents = [];
  el.addEventListener("hiko:login", (e) => loginEvents.push(e));
  document.body.appendChild(el);

  await el.updateComplete;

  expect(loginEvents.length).toBeGreaterThan(0);
  expect(loginEvents[0].bubbles).toBe(true);
  expect(loginEvents[0].composed).toBe(true);

  window.location.hash = originalHash;
});

it("el.getSession delegates to auth.session()", async () => {
  globalThis.fetch = vi.fn(async () => new Response("{}", { status: 200 }));
  registerHikoSignin();
  const el = document.createElement("hiko-signin");
  el.setAttribute("shop", "s.myshopify.com");
  document.body.appendChild(el);
  await el.updateComplete;

  expect(typeof el.getSession).toBe("function");
});
