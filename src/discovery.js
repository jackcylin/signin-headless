// NOTE: confirm API_VERSION + graphql path against Shopify Customer Account API docs.
export const API_VERSION = "2026-04";

export async function discover({ shopId, fetchImpl = fetch }) {
  const base = `https://shopify.com/authentication/${shopId}`;
  const res = await fetchImpl(`${base}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error("discovery_failed");
  const m = await res.json();
  return {
    authorizationEndpoint: m.authorization_endpoint,
    tokenEndpoint: m.token_endpoint,
    endSessionEndpoint: m.end_session_endpoint,
    graphqlEndpoint: `https://shopify.com/${shopId}/account/customer/api/${API_VERSION}/graphql`,
  };
}
