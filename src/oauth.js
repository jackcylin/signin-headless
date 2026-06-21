export function buildAuthorizeUrl({ authorizationEndpoint, clientId, redirectUri, scope, state, codeChallenge, providerHint }) {
  const u = new URL(authorizationEndpoint);
  const p = u.searchParams;
  p.set("response_type", "code");
  p.set("client_id", clientId);
  p.set("redirect_uri", redirectUri);
  p.set("scope", scope);
  p.set("state", state);
  p.set("code_challenge", codeChallenge);
  p.set("code_challenge_method", "S256");
  if (providerHint) p.set("login_hint", providerHint); // routed to the provider via the signin IdP
  return u.toString();
}

function toTokens(j) {
  return {
    accessToken: j.access_token,
    refreshToken: j.refresh_token,
    idToken: j.id_token,
    expiresAt: Date.now() + (j.expires_in ?? 0) * 1000,
  };
}

async function postToken(tokenEndpoint, params, fetchImpl) {
  const res = await fetchImpl(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  if (!res.ok) throw new Error("token_request_failed");
  return toTokens(await res.json());
}

export function exchangeCode({ tokenEndpoint, clientId, code, codeVerifier, redirectUri, fetchImpl = fetch }) {
  return postToken(tokenEndpoint, {
    grant_type: "authorization_code", client_id: clientId, code,
    code_verifier: codeVerifier, redirect_uri: redirectUri,
  }, fetchImpl);
}

export function refreshTokens({ tokenEndpoint, clientId, refreshToken, fetchImpl = fetch }) {
  return postToken(tokenEndpoint, {
    grant_type: "refresh_token", client_id: clientId, refresh_token: refreshToken,
  }, fetchImpl);
}
