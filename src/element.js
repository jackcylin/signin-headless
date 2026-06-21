// src/element.js
import { defineHikoSignin } from "./widget/index.js";
import { createHeadlessAuth } from "./auth.js";
import { createHeadlessTransport } from "./transport.js";

export function registerHikoSignin() {
  defineHikoSignin((el) => {
    const auth = createHeadlessAuth({
      shop: el.getAttribute("shop"),
      configServer: el.getAttribute("config-server") || undefined,
    });
    // Complete a redirect-back on the page hosting the element.
    if (auth.hasPendingCallback()) auth.handleCallback();
    el._auth = auth; // expose for app code: el._auth.query(...)
    // Headless always pulls per-shop config (providers/appearance) from the
    // server. Enable the widget's self-fetch so it calls the transport's
    // getConfig() on connect — without this it renders email-only (no providers).
    // The factory runs in connectedCallback BEFORE the widget's fetchConfig check,
    // so setting it here takes effect on this connect.
    el.fetchConfig = true;
    return createHeadlessTransport(auth);
  });
}

registerHikoSignin();
