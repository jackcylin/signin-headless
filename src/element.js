// src/element.js
import { defineHikoSignin } from "./widget/index.js";
import { createHeadlessAuth } from "./auth.js";
import { createHeadlessTransport } from "./transport.js";

// Full-screen spinner shown INSIDE the OAuth popup while it finishes the
// handshake (fetch token + customer) and before it self-closes — so the user
// sees a clean spinner instead of the storefront page flashing in the popup.
function showPopupOverlay() {
  if (typeof document === "undefined" || document.getElementById("hiko-popup-overlay")) return;
  const style = document.createElement("style");
  style.textContent =
    "@keyframes hiko-spin{to{transform:rotate(360deg)}}" +
    "#hiko-popup-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;" +
    "align-items:center;justify-content:center;background:#fff}" +
    "#hiko-popup-overlay>div{width:36px;height:36px;border:4px solid #ddd;" +
    "border-top-color:#555;border-radius:50%;animation:hiko-spin .7s linear infinite}";
  const overlay = document.createElement("div");
  overlay.id = "hiko-popup-overlay";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-label", "Signing in");
  overlay.appendChild(document.createElement("div"));
  (document.head || document.documentElement).appendChild(style);
  (document.body || document.documentElement).appendChild(overlay);
}

export function registerHikoSignin() {
  defineHikoSignin((el) => {
    const auth = createHeadlessAuth({
      shop: el.getAttribute("shop"),
      configServer: el.getAttribute("config-server") || undefined,
      mode: el.getAttribute("mode") || undefined,
    });

    // Popup-relay case: this element instance is running INSIDE the OAuth popup.
    // Hide the (flashed) storefront page behind a spinner, relay the session back
    // to the opener, then close — do not run the normal flow.
    if (auth.isPopupCallback()) {
      showPopupOverlay();
      auth.completePopupCallback().catch(() => {});
      return createHeadlessTransport(auth);
    }

    // Wire login phase signals to DOM events so consumers can show/hide spinners.
    auth.onLoginPhase?.((phase, detail) => {
      const type = phase === "start" ? "hiko:loginstart" : "hiko:logincancel";
      el.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail: detail ?? null }));
    });

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
