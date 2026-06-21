# @hiko/signin-headless

Headless social login for Shopify **new customer accounts** — a browser-only,
**public-client + PKCE** module that drops the same `<hiko-signin>` widget your
theme storefront uses into any headless storefront (React, Vue, Hydrogen, plain
HTML…), with **no backend required**.

It is the headless companion to **HIKO Social Login Plus** — install that app on
your store and this module renders its configured providers and runs the login.

- App Store: **[HIKO Social Login Plus](https://apps.shopify.com/simple-social-login)** (HIKO Software)
- Config/provider setup lives in the HIKO admin; this module only consumes it.

---

## Design principles

- **Public client, browser-only.** Login runs as an OAuth **PKCE** flow entirely
  in the browser against Shopify's Customer Account API. There is **no server to
  deploy** — ideal for static/JAMstack storefronts.
- **Token in the browser (in-memory).** The Customer Account API access/refresh
  tokens live only in an in-memory store; only the single-use PKCE
  `{state, verifier}` touches `sessionStorage`. Nothing is written to
  `localStorage` or cookies. (See [Security](#security) for the trade-off.)
- **Direct Customer Account API.** After login you query the logged-in customer's
  data (profile, orders, addresses) directly via GraphQL — no BFF/proxy.
- **Config from the HIKO server.** Which providers to show and how they look comes
  from `GET <config-server>/headless/config?shop=…` at runtime, so the storefront
  hard-codes almost nothing.
- **Identical UI.** It renders the very same `<hiko-signin>` web component as the
  HIKO theme-storefront widget, so headless and themed stores look the same.
- **New customer accounts only.** Legacy/classic customer accounts are not
  supported.

---

## Prerequisites (necessary conditions)

1. **The store has [HIKO Social Login Plus](https://apps.shopify.com/simple-social-login) installed** and your social
   providers configured in its admin. Without it, `/headless/config` returns no
   providers and the widget renders nothing.
2. **New customer accounts** are enabled on the store (Settings → Customer
   accounts). This module does not work with legacy/classic accounts.
3. The store has the **Headless sales channel** installed, with its **Customer
   Account API set up for a public, browser-based client** — see
   [Required Shopify setup](#required-shopify-setup) below.

---

## Required Shopify setup

In Shopify admin → **Sales channels → Headless → your storefront → Customer
Account API → *Application setup*** (install the **Headless** sales channel first
if it isn't present). This screen — **not** Settings → Customer accounts — is where
the Client ID / Shop ID live and where you configure:

1. A **public** OAuth client with the **PKCE** flow.
2. **JavaScript Origins** — add every storefront origin (enables CORS on the token
   and GraphQL endpoints).
3. **Redirect/Callback URIs** — the page(s) that host `<hiko-signin>` and complete
   the redirect.
4. (and confirm **new customer accounts** are enabled, under Settings → Customer
   accounts).

> **HTTPS only — no `localhost`.** Shopify rejects `http://` and `localhost`
> origins/redirect URIs. For local development, expose your dev server over an
> **HTTPS tunnel** (e.g. `ngrok http 5173` or `cloudflared`) and register the
> tunnel URL in both JavaScript Origins and Redirect URIs.

You then supply `client-id` and `shop-id` to this module (both public — see
[Getting the values](#getting-the-config-values)).

---

## Install

```bash
npm install @hiko/signin-headless
```

---

## Usage

### As a web component (any framework / plain HTML)

```html
<hiko-signin
  shop="your-shop.myshopify.com"
  client-id="<public client id>"
  shop-id="<numeric shop id>"
  config-server="https://signin.hiko.software">
</hiko-signin>

<script type="module">
  import "@hiko/signin-headless/element"; // registers <hiko-signin>
</script>
```

After login, read the logged-in customer directly off the element:

```js
const el = document.querySelector("hiko-signin");
const data = await el._auth.query("{ customer { firstName emailAddress { emailAddress } } }");
```

### Programmatic SDK (drive it yourself)

```js
import { createHeadlessAuth } from "@hiko/signin-headless";

const auth = createHeadlessAuth({
  shop: "your-shop.myshopify.com",
  clientId: "<public client id>",
  shopId: "<numeric shop id>",
  configServer: "https://signin.hiko.software", // optional, this is the default
});

await auth.loadConfig();         // providers + appearance from the HIKO server
auth.login("google");            // → redirects to Shopify (PKCE)
await auth.handleCallback();      // on the redirect-back page: exchanges the code
await auth.query("{ customer { firstName } }");  // direct Customer Account API
await auth.logout();
```

Exports: `createHeadlessAuth`, `memoryTokenStore`, `registerHikoSignin`, and the
side-effect `@hiko/signin-headless/element` entry (registers `<hiko-signin>`).

---

## Getting the config values

All four values are **public** (no secrets). The `<hiko-signin>` attributes map to
the `VITE_*` env vars used by the local dev server (see [Run locally](#run-locally)).

| Attribute / env | What it is | Where to get it |
| --- | --- | --- |
| `shop` / `VITE_SHOP` | Store domain `*.myshopify.com` | Shopify admin → Settings → Domains, or your admin URL (`admin.shopify.com/store/<handle>`) |
| `client-id` / `VITE_CLIENT_ID` | Customer Account API **public** client id | Admin → **Sales channels → Headless → your storefront → Customer Account API → *Application setup*** (the same screen as the setup above) |
| `shop-id` / `VITE_SHOP_ID` | **Numeric** shop id | Same Headless → Customer Account API screen (listed next to the Client ID). Also visible at Settings → Customer accounts → URL as `https://shopify.com/<SHOP_ID>/account`. |
| `config-server` / `VITE_CONFIG_SERVER` | HIKO server serving per-shop config | `https://signin.hiko.software` (default; only change if you self-host HIKO) |

---

## Run locally

The package ships a runnable demo (`index.html`) served by Vite:

```bash
cp .env.example .env     # then fill in the values (see the table above)
npm install
npm run dev              # serves the demo (default http://localhost:5173)
```

`npm run dev` reads `.env` and mounts `<hiko-signin>` with your values; the
**whoami** button calls `el._auth.query(...)` to show the logged-in customer.

> **You can't sign in over plain `localhost`** — Shopify rejects `http://` and
> `localhost` origins. To test the real login, expose the dev server over an
> **HTTPS tunnel** (e.g. `ngrok http 5173`), open the **tunnel URL** (not
> `localhost`), and add that tunnel URL to the store's **JavaScript Origins** and
> **Redirect URIs** (Headless → Customer Account API → Application setup).

---

## How it works

```
<hiko-signin> (this module)
   │  loadConfig() → GET <config-server>/headless/config?shop=…   (providers/appearance)
   │  click a provider → PKCE → redirect …
   ▼
Shopify Customer Account API (OIDC)  ──→  hosted login page
   │  social buttons federate to HIKO's IdP, customer authenticates
   ▼
…redirect back → handleCallback() exchanges code → tokens (in-memory)
   ▼
el._auth.query(...) → Customer Account API GraphQL (direct, Authorization: <token>)
```

---

## Security

The Customer Account API access token lives in the **browser** (in-memory by
default; only the single-use PKCE verifier touches `sessionStorage`). This is the
deliberate trade-off for a zero-backend module: it is more exposed to XSS than a
server-side, httpOnly-cookie integration. Mitigations: short-lived access tokens
with refresh rotation (built in), and a strict **Content-Security-Policy** on your
storefront. If you require the strongest posture, use a server-side Customer
Account API integration instead.

---

## License

MIT
