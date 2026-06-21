// src/auth.js
import { memoryTokenStore } from "./token-store.js";
import { loadConfig } from "./config-client.js";
import { discover } from "./discovery.js";
import { buildAuthorizeUrl, exchangeCode, refreshTokens } from "./oauth.js";
import { customerQuery } from "./customer-api.js";
import { generateVerifier, challengeFromVerifier, randomString } from "./pkce.js";

const PKCE_KEY = "hiko:pkce";

export function createHeadlessAuth(opts) {
  const {
    shop, configServer = "https://hiko.link", clientId, shopId,
    redirectUri = (typeof location !== "undefined" ? location.origin + location.pathname : ""),
    scope = "openid email customer-account-api:full",
    tokenStore = memoryTokenStore(), fetchImpl = fetch,
  } = opts;

  const listeners = new Set();
  const emit = () => listeners.forEach((cb) => cb(api));
  let endpoints = null;
  const getEndpoints = async () => (endpoints ??= await discover({ shopId, fetchImpl }));

  const api = {
    _navigate: (url) => location.assign(url),
    _getCallbackParams: () => { const q = new URL(location.href).searchParams; return { code: q.get("code"), state: q.get("state") }; },
    _tokenStore: () => tokenStore,

    loadConfig: () => loadConfig({ configServer, shop, fetchImpl }),

    async login(providerHint) {
      const ep = await getEndpoints();
      const verifier = generateVerifier();
      const state = randomString(16);
      const codeChallenge = await challengeFromVerifier(verifier);
      sessionStorage.setItem(PKCE_KEY, JSON.stringify({ state, verifier }));
      api._navigate(buildAuthorizeUrl({ authorizationEndpoint: ep.authorizationEndpoint, clientId, redirectUri, scope, state, codeChallenge, providerHint }));
    },

    hasPendingCallback() {
      const { code, state } = api._getCallbackParams();
      return Boolean(code && state);
    },

    async handleCallback() {
      const { code, state } = api._getCallbackParams();
      const saved = JSON.parse(sessionStorage.getItem(PKCE_KEY) || "null");
      if (!saved || saved.state !== state) throw new Error("state_mismatch");
      const ep = await getEndpoints();
      const tokens = await exchangeCode({ tokenEndpoint: ep.tokenEndpoint, clientId, code, codeVerifier: saved.verifier, redirectUri, fetchImpl });
      tokenStore.set(tokens);
      sessionStorage.removeItem(PKCE_KEY);
      emit();
    },

    isLoggedIn: () => Boolean(tokenStore.get()?.accessToken),

    async query(query, variables) {
      const ep = await getEndpoints();
      const run = (at) => customerQuery({ graphqlEndpoint: ep.graphqlEndpoint, accessToken: at, query, variables, fetchImpl });
      try {
        return await run(tokenStore.get()?.accessToken);
      } catch (e) {
        if (e.message !== "unauthorized") throw e;
        const cur = tokenStore.get();
        if (!cur?.refreshToken) throw e;
        const fresh = await refreshTokens({ tokenEndpoint: ep.tokenEndpoint, clientId, refreshToken: cur.refreshToken, fetchImpl });
        tokenStore.set(fresh);
        emit();
        return run(fresh.accessToken);
      }
    },

    async logout() {
      const ep = await getEndpoints();
      tokenStore.clear();
      emit();
      api._navigate(ep.endSessionEndpoint);
    },

    onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
  };
  return api;
}
