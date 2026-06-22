// src/element.js
import { defineHikoSignin } from "./widget/index.js";
import { createHeadlessAuth } from "./auth.js";
import { createHeadlessTransport } from "./transport.js";

export function registerHikoSignin() {
  defineHikoSignin((el) => {
    const auth = createHeadlessAuth({
      shop: el.getAttribute("shop"),
      configServer: el.getAttribute("config-server") || undefined,
      mode: el.getAttribute("mode") || undefined,
    });

    // Popup-relay case: this element instance is running INSIDE the OAuth popup.
    // Relay the session back to the opener then close — do not run the normal flow.
    if (auth.isPopupCallback()) {
      auth.completePopupCallback();
      return createHeadlessTransport(auth);
    }

    // Wire auth state changes to DOM events BEFORE handling any pending callback,
    // so the hiko:login event fires if handleCallback() sets a token below.
    auth.onChange((a) => {
      if (a.isLoggedIn()) {
        el.dispatchEvent(
          new CustomEvent("hiko:login", {
            bubbles: true,
            composed: true,
            detail: { customer: auth.getLastCustomer?.() ?? null },
          }),
        );
      } else {
        el.dispatchEvent(
          new CustomEvent("hiko:logout", { bubbles: true, composed: true }),
        );
      }
    });

    // Complete a redirect-back on the page hosting the element.
    // onChange is already registered above so hiko:login fires immediately.
    if (auth.hasPendingCallback()) auth.handleCallback();

    // Headless always pulls per-shop config (providers/appearance) from the
    // server. Enable the widget's self-fetch so it calls the transport's
    // getConfig() on connect — without this it renders email-only (no providers).
    el.fetchConfig = true;

    // Attach the public API directly on the element — the element IS the widget.
    el.login = (provider) => auth.login(provider);
    el.logout = () => auth.logout();
    el.query = (q, vars) => auth.query(q, vars);
    el.getToken = () => auth.getToken();
    el.getSession = () => auth.session();
    el.isLoggedIn = () => auth.isLoggedIn();

    return createHeadlessTransport(auth);
  });
}

registerHikoSignin();
