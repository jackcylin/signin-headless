// src/element.js
import { defineHikoSignin } from "@hiko/signin-widget";
import { createHeadlessAuth } from "./auth.js";
import { createHeadlessTransport } from "./transport.js";

export function registerHikoSignin() {
  defineHikoSignin((el) => {
    const auth = createHeadlessAuth({
      shop: el.getAttribute("shop"),
      configServer: el.getAttribute("config-server") || undefined,
      clientId: el.getAttribute("client-id"),
      shopId: el.getAttribute("shop-id"),
      redirectUri: el.getAttribute("redirect-uri") || undefined,
    });
    // Complete a redirect-back on the page hosting the element.
    if (auth.hasPendingCallback()) auth.handleCallback().catch(() => {});
    el._auth = auth; // expose for app code: el._auth.query(...)
    return createHeadlessTransport(auth);
  });
}

registerHikoSignin();
