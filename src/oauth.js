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
