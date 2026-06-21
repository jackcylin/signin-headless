// Shopify's Customer Account API endpoints are a fixed pattern off the numeric
// shop id. The OIDC discovery doc at
// `https://shopify.com/authentication/<shopId>/.well-known/openid-configuration`
// returns exactly these values — but that doc is NOT CORS-enabled, so a browser
// fetch of it is blocked and would break login. A public browser client therefore
// constructs the endpoints directly (no network).
//
// NOTE: confirm API_VERSION + the graphql path against the Shopify Customer
// Account API docs for your pinned version.
export const API_VERSION = "2026-04";

export function discover({ shopId }) {
  const base = `https://shopify.com/authentication/${shopId}`;
  return {
    authorizationEndpoint: `${base}/oauth/authorize`,
    tokenEndpoint: `${base}/oauth/token`,
    endSessionEndpoint: `${base}/logout`,
    graphqlEndpoint: `https://shopify.com/${shopId}/account/customer/api/${API_VERSION}/graphql`,
  };
}
