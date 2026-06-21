// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HikoSignin } from "@hiko/signin-widget";
import { registerHikoSignin } from "../src/index.js";

beforeEach(() => { HikoSignin.transportFactory = null; });

it("registers <hiko-signin> wired to a headless transport built from attributes", async () => {
  registerHikoSignin();
  const el = document.createElement("hiko-signin");
  el.setAttribute("shop", "s.myshopify.com");
  el.setAttribute("client-id", "cid");
  el.setAttribute("shop-id", "123");
  // jsdom: fetch is undefined; assert wiring, not network
  globalThis.fetch = vi.fn(async () => new Response("{}", { status: 200 }));
  document.body.appendChild(el);
  await el.updateComplete;
  expect(el._transport).toBeTruthy();
  expect(typeof el._transport.getConfig).toBe("function");
});
