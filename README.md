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
3. The store's **Customer Account API is set up for a public, browser-based
   client** — see [Required Shopify setup](#required-shopify-setup) below.

---

## Required Shopify setup

In Shopify admin → Settings → Customer accounts → your headless storefront's
**Customer Account API** → *Application setup*:

1. Enable a **public** OAuth client with the **PKCE** flow.
2. Add every storefront origin (e.g. `https://shop.example.com`, and
   `http://localhost:5173` for local dev) to **JavaScript Origins** — this enables
   CORS on the token and GraphQL endpoints.
3. Add your storefront callback URL(s) to **Redirect URIs** (the page that hosts
   `<hiko-signin>` and completes the redirect).
4. Confirm **new customer accounts** are enabled.

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
| `client-id` / `VITE_CLIENT_ID` | Customer Account API **public** client id | Admin → Settings → Customer accounts → Customer Account API → *Application setup* (the same screen as the setup above) |
| `shop-id` / `VITE_SHOP_ID` | **Numeric** shop id | Same screen — the auth URL reads `https://shopify.com/authentication/<SHOP_ID>`; copy the number. (Also the trailing digits of `gid://shopify/Shop/<id>`.) |
| `config-server` / `VITE_CONFIG_SERVER` | HIKO server serving per-shop config | `https://signin.hiko.software` (default; only change if you self-host HIKO) |

---

## Run locally

The package ships a runnable demo (`index.html`) served by Vite:

```bash
cp .env.example .env     # then fill in the values (see the table above)
npm install
npm run dev              # → http://localhost:5173
```

`npm run dev` reads `.env` and mounts `<hiko-signin>` with your values; the
**whoami** button calls `el._auth.query(...)` to show the logged-in customer.
(Remember to add `http://localhost:5173` to the store's **JavaScript Origins** and
**Redirect URIs** while developing.)

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
