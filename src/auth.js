// src/auth.js
import { loadConfig as _loadConfig } from "./config-client.js";

const DEFAULT_CUSTOMER_QUERY =
  "{ customer { firstName lastName emailAddress { emailAddress } } }";

export function createHeadlessAuth({
  shop,
  configServer = "https://signin.hiko.software",
  returnUrl,
  fetchImpl = fetch,
  mode = "redirect",
} = {}) {
  let token = null;
  let lastCustomer = null;
  const listeners = new Set();
  const emit = () => listeners.forEach((cb) => cb(api));

  const api = {
    // ── Seams (overridable for testing) ────────────────────────────────────
    _navigate: (url) => location.assign(url),
    _getHash: () => location.hash,
    _openPopup: (url) =>
      typeof window !== "undefined"
        ? window.open(
            url,
            "hiko-signin",
            "width=480,height=720,menubar=no,toolbar=no,location=yes",
          )
        : null,
    _postToOpener: (msg) => {
      if (typeof window !== "undefined" && window.opener) {
        window.opener.postMessage(msg, location.origin);
      }
    },
    _closeSelf: () => {
      if (typeof window !== "undefined") window.close();
    },
    _isPopup: () =>
      typeof window !== "undefined" &&
      window.name === "hiko-signin" &&
      !!window.opener,

    // ── Config ─────────────────────────────────────────────────────────────
    loadConfig() {
      return _loadConfig({ configServer, shop, fetchImpl });
    },

    // ── Login ──────────────────────────────────────────────────────────────
    login(provider) {
      if (mode === "popup") {
        api._loginPopup(provider);
      } else {
        api._loginRedirect(provider);
      }
    },

    _loginRedirect(provider) {
      const rt =
        returnUrl ?? (typeof location !== "undefined" ? location.href : "");
      const url = new URL(`${configServer}/headless/start`);
      url.searchParams.set("shop", shop);
      url.searchParams.set("return", rt);
      if (provider) url.searchParams.set("provider", provider);
      api._navigate(url.toString());
    },

    _loginPopup(provider) {
      const rt =
        returnUrl ?? (typeof location !== "undefined" ? location.href : "");
      const url = new URL(`${configServer}/headless/start`);
      url.searchParams.set("shop", shop);
      url.searchParams.set("return", rt);
      if (provider) url.searchParams.set("provider", provider);
      const startUrl = url.toString();

      const popup = api._openPopup(startUrl);

      if (!popup) {
        // Popup was blocked — fall back to redirect
        api._navigate(startUrl);
        return;
      }

      // Listen for the session relay from the popup
      function onMessage(e) {
        // Security: only accept from same origin AND from the popup we opened
        if (e.origin !== location.origin) return;
        if (e.source !== popup) return;
        if (!e.data || e.data.type !== "hiko:session") return;

        // Accept the session
        token = e.data.session;
        if (e.data.customer) lastCustomer = e.data.customer;
        cleanup();
        emit();
      }

      // Poll for popup closure (user closed without completing)
      const pollId = setInterval(() => {
        if (popup.closed) cleanup();
      }, 400);

      function cleanup() {
        window.removeEventListener("message", onMessage);
        clearInterval(pollId);
      }

      window.addEventListener("message", onMessage);
    },

    // ── Popup-side relay ───────────────────────────────────────────────────

    /** True when this window IS the popup and has a pending callback hash. */
    isPopupCallback() {
      return api._isPopup() && api.hasPendingCallback();
    },

    /** Runs INSIDE the popup: completes the callback, posts session to opener, closes. */
    async completePopupCallback() {
      if (!api.handleCallback()) {
        api._postToOpener({ type: "hiko:error", error: "no_session" });
        api._closeSelf();
        return;
      }
      // token is now set (handleCallback stored it)
      const sessionValue = token;
      try {
        const tk = await api.getToken();
        const data = await api.query(DEFAULT_CUSTOMER_QUERY);
        api._postToOpener({
          type: "hiko:session",
          session: sessionValue,
          accessToken: tk?.accessToken,
          expiresAt: tk?.expiresAt,
          customer: data?.customer,
        });
      } catch (err) {
        api._postToOpener({
          type: "hiko:error",
          error: String(err?.message || err),
        });
      } finally {
        api._closeSelf();
      }
    },

    // ── Callback helpers ───────────────────────────────────────────────────

    hasPendingCallback() {
      const hash = api._getHash();
      return hash.includes("hiko_session=");
    },

    handleCallback() {
      const hash = api._getHash();
      const params = new URLSearchParams(hash.slice(1));
      const sessionToken = params.get("hiko_session");
      if (!sessionToken) return false;
      token = sessionToken;
      history.replaceState(null, "", location.pathname + location.search);
      emit();
      return true;
    },

    // ── State ──────────────────────────────────────────────────────────────

    isLoggedIn() {
      return token !== null;
    },

    getLastCustomer() {
      return lastCustomer;
    },

    // ── API calls ──────────────────────────────────────────────────────────

    async query(query, variables) {
      const res = await fetchImpl(`${configServer}/headless/customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables }),
      });
      if (res.status === 401) {
        token = null;
        emit();
        throw new Error("unauthorized");
      }
      if (!res.ok) throw new Error(`query_failed:${res.status}`);
      const json = await res.json();
      return json.data;
    },

    async session() {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetchImpl(`${configServer}/headless/session`, {
        headers,
      });
      if (!res.ok) throw new Error(`session_failed:${res.status}`);
      return res.json();
    },

    async getToken() {
      if (!token) return null;
      const res = await fetchImpl(`${configServer}/headless/token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        token = null;
        emit();
        throw new Error("unauthorized");
      }
      if (!res.ok) throw new Error(`token_failed:${res.status}`);
      return res.json(); // { accessToken, expiresAt }
    },

    async logout() {
      await fetchImpl(`${configServer}/headless/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      token = null;
      emit();
    },

    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };

  return api;
}
