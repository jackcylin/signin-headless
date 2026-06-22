// src/auth.js
import { loadConfig as _loadConfig } from "./config-client.js";

export function createHeadlessAuth({
  shop,
  configServer = "https://signin.hiko.software",
  returnUrl,
  fetchImpl = fetch,
} = {}) {
  let token = null;
  const listeners = new Set();
  const emit = () => listeners.forEach((cb) => cb(api));

  const api = {
    // Seams (overridable for testing)
    _navigate: (url) => location.assign(url),
    _getHash: () => location.hash,

    loadConfig() {
      return _loadConfig({ configServer, shop, fetchImpl });
    },

    login(provider) {
      const rt = returnUrl ?? (typeof location !== "undefined" ? location.href : "");
      const url = new URL(`${configServer}/headless/start`);
      url.searchParams.set("shop", shop);
      url.searchParams.set("return", rt);
      if (provider) url.searchParams.set("provider", provider);
      api._navigate(url.toString());
    },

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

    isLoggedIn() {
      return token !== null;
    },

    async query(query, variables) {
      const res = await fetchImpl(`${configServer}/headless/customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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
      const res = await fetchImpl(`${configServer}/headless/session`, { headers });
      if (!res.ok) throw new Error(`session_failed:${res.status}`);
      return res.json();
    },

    async getToken() {
      if (!token) return null;
      const res = await fetchImpl(`${configServer}/headless/token`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.status === 401) { token = null; emit(); throw new Error("unauthorized"); }
      if (!res.ok) throw new Error(`token_failed:${res.status}`);
      return res.json(); // { accessToken, expiresAt }
    },

    async logout() {
      await fetchImpl(`${configServer}/headless/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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
