# @hiko/signin-headless

Headless Shopify Customer Account (OIDC) social login — public client + PKCE,
browser-only, no backend. Renders the same `<hiko-signin>` widget as the theme
storefront; config (providers/appearance) is pulled from your HIKO `config-server`.

## Use
```html
<hiko-signin shop="x.myshopify.com" client-id="<public client id>" shop-id="<numeric shop id>"></hiko-signin>
<script type="module" src="https://cdn/.../dist/element.js"></script>
```
Read the logged-in customer directly: `el._auth.query("{ customer { firstName } }")`.

## Required Shopify setup (Customer Account API)
1. Enable a **public** OAuth client + **PKCE**.
2. Add every storefront origin to **JavaScript Origins** (CORS for token + GraphQL).
3. Add your storefront callback URL to **Redirect URIs**.
4. Enable **new customer accounts**.
You supply `client-id` and `shop-id` (both public, from your Shopify admin).

## Security
The access token lives in the browser (in-memory by default). Use a strict CSP.
For maximum security use a server-side integration instead.
