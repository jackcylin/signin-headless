// src/element.js
import { defineHikoSignin } from "@hiko/signin-widget";

// src/token-store.js
function memoryTokenStore() {
  let tokens = null;
  return {
    get: () => tokens,
    set: (t) => {
      tokens = t;
    },
    clear: () => {
      tokens = null;
    }
  };
}

// src/config-client.js
async function loadConfig({ configServer, shop, fetchImpl = fetch }) {
  const url = `${configServer}/headless/config?shop=${encodeURIComponent(shop)}`;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error("config_unavailable");
  return res.json();
}

// src/discovery.js
var API_VERSION = "2026-04";
async function discover({ shopId, fetchImpl = fetch }) {
  const base = `https://shopify.com/authentication/${shopId}`;
  const res = await fetchImpl(`${base}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error("discovery_failed");
  const m = await res.json();
  return {
    authorizationEndpoint: m.authorization_endpoint,
    tokenEndpoint: m.token_endpoint,
    endSessionEndpoint: m.end_session_endpoint,
    graphqlEndpoint: `https://shopify.com/${shopId}/account/customer/api/${API_VERSION}/graphql`
  };
}

// src/oauth.js
function buildAuthorizeUrl({ authorizationEndpoint, clientId, redirectUri, scope, state, codeChallenge, providerHint }) {
  const u = new URL(authorizationEndpoint);
  const p = u.searchParams;
  p.set("response_type", "code");
  p.set("client_id", clientId);
  p.set("redirect_uri", redirectUri);
  p.set("scope", scope);
  p.set("state", state);
  p.set("code_challenge", codeChallenge);
  p.set("code_challenge_method", "S256");
  if (providerHint) p.set("login_hint", providerHint);
  return u.toString();
}
function toTokens(j) {
  return {
    accessToken: j.access_token,
    refreshToken: j.refresh_token,
    idToken: j.id_token,
    expiresAt: Date.now() + (j.expires_in ?? 0) * 1e3
  };
}
async function postToken(tokenEndpoint, params, fetchImpl) {
  const res = await fetchImpl(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString()
  });
  if (!res.ok) throw new Error("token_request_failed");
  return toTokens(await res.json());
}
function exchangeCode({ tokenEndpoint, clientId, code, codeVerifier, redirectUri, fetchImpl = fetch }) {
  return postToken(tokenEndpoint, {
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri
  }, fetchImpl);
}
function refreshTokens({ tokenEndpoint, clientId, refreshToken, fetchImpl = fetch }) {
  return postToken(tokenEndpoint, {
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken
  }, fetchImpl);
}

// src/customer-api.js
async function customerQuery({ graphqlEndpoint, accessToken, query, variables, fetchImpl = fetch }) {
  const res = await fetchImpl(graphqlEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": accessToken },
    body: JSON.stringify({ query, variables })
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error("graphql_request_failed");
  const { data, errors } = await res.json();
  if (errors == null ? void 0 : errors.length) throw Object.assign(new Error("graphql_errors"), { errors });
  return data;
}

// src/pkce.js
var b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function randomString(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}
function generateVerifier() {
  return randomString(32);
}
async function challengeFromVerifier(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return b64url(digest);
}

// src/auth.js
var PKCE_KEY = "hiko:pkce";
function createHeadlessAuth(opts) {
  const {
    shop,
    configServer = "https://hiko.link",
    clientId,
    shopId,
    redirectUri = typeof location !== "undefined" ? location.origin + location.pathname : "",
    scope = "openid email customer-account-api:full",
    tokenStore = memoryTokenStore(),
    fetchImpl = fetch
  } = opts;
  const listeners = /* @__PURE__ */ new Set();
  const emit = () => listeners.forEach((cb) => cb(api));
  let endpoints = null;
  const getEndpoints = async () => endpoints ??= await discover({ shopId, fetchImpl });
  const api = {
    _navigate: (url) => location.assign(url),
    _getCallbackParams: () => {
      const q = new URL(location.href).searchParams;
      return { code: q.get("code"), state: q.get("state") };
    },
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
    isLoggedIn: () => {
      var _a;
      return Boolean((_a = tokenStore.get()) == null ? void 0 : _a.accessToken);
    },
    async query(query, variables) {
      var _a;
      const ep = await getEndpoints();
      const run = (at) => customerQuery({ graphqlEndpoint: ep.graphqlEndpoint, accessToken: at, query, variables, fetchImpl });
      try {
        return await run((_a = tokenStore.get()) == null ? void 0 : _a.accessToken);
      } catch (e) {
        if (e.message !== "unauthorized") throw e;
        const cur = tokenStore.get();
        if (!(cur == null ? void 0 : cur.refreshToken)) throw e;
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
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    }
  };
  return api;
}

// src/transport.js
function createHeadlessTransport(auth) {
  return {
    getConfig: () => auth.loadConfig(),
    selectSocial: async (provider) => {
      await auth.login(provider);
      return { navigateTo: null };
    },
    selectEmail: async () => {
      await auth.login();
      return { navigateTo: null };
    }
  };
}

// src/element.js
function registerHikoSignin() {
  defineHikoSignin((el) => {
    const auth = createHeadlessAuth({
      shop: el.getAttribute("shop"),
      configServer: el.getAttribute("config-server") || void 0,
      clientId: el.getAttribute("client-id"),
      shopId: el.getAttribute("shop-id"),
      redirectUri: el.getAttribute("redirect-uri") || void 0
    });
    if (auth.hasPendingCallback()) auth.handleCallback().catch(() => {
    });
    el._auth = auth;
    return createHeadlessTransport(auth);
  });
}
registerHikoSignin();

export {
  memoryTokenStore,
  createHeadlessAuth,
  registerHikoSignin
};
