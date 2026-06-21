# @hiko/signin-headless

Headless social login for Shopify **new customer accounts** — drops the same
`<hiko-signin>` widget your theme storefront uses into any headless storefront
(React, Vue, Hydrogen, plain HTML…).

It is the headless companion to **HIKO Social Login Plus** — install that app on
your store and this module renders its configured providers and runs the login.

- App Store: **[HIKO Social Login Plus](https://apps.shopify.com/simple-social-login)** (HIKO Software)
- Provider setup lives in the HIKO admin; this module only consumes it.

---

## Design principles

- **Broker model — tokens never leave the server.** Login and token exchange run
  on the **HIKO server (broker)**; the browser never performs OAuth/PKCE and
  never holds a Shopify Customer Account API token. After authentication the
  browser holds only an **opaque session token** (in-memory), which it sends to
  the broker's BFF for customer GraphQL queries.
- **Works from `localhost` with no tunnel.** Because the broker handles all OAuth
  redirects, the storefront origin never needs to be registered as a Shopify
  redirect URI. Merchants add `http://localhost:5173` (or any origin) to the
  **Allowed origins** list in the HIKO admin — that is all.
- **Config from the HIKO server.** Which providers to show and how they look
  comes from `GET <config-server>/headless/config?shop=…` at runtime.
- **Identical UI.** Renders the same `<hiko-signin>` web component as the HIKO
  theme-storefront widget.
- **New customer accounts only.** Legacy/classic customer accounts are not
  supported.

---

## Prerequisites

1. **The store has [HIKO Social Login Plus](https://apps.shopify.com/simple-social-login) installed** and social providers
   configured in its admin. Without it, `/headless/config` returns no providers
   and the widget renders nothing.
2. **New customer accounts** are enabled on the store (Settings → Customer
   accounts). This module does not work with legacy/classic accounts.
3. **The merchant has completed the one-time HIKO admin setup** described below.
   The storefront developer does NO Shopify setup.

---

## One-time merchant setup (HIKO admin)

The merchant does this **once** in the HIKO admin — the storefront developer
does not need to touch Shopify's Headless sales channel or configure any OAuth
URIs.

In **HIKO admin → Integrations → Customer Account API**:

1. Enter the store's **Customer Account API Client ID** and **Client Secret**
   (from Shopify admin → Sales channels → Headless → your storefront →
   Customer Account API → Application setup).
2. Enter the **Shop ID** (numeric; shown on the same Headless screen, and at
   Settings → Customer accounts → URL as `https://shopify.com/<SHOP_ID>/account`).
3. On the Shopify Customer Account API client, add the HIKO broker's
   **single callback URL** as a Redirect URI:
   `<config-server>/headless/callback`
   (e.g. `https://signin.hiko.software/headless/callback`). This is the only
   redirect URI that needs to be registered — it belongs to the HIKO server,
   not the storefront.
4. In the same HIKO admin screen, add every **storefront origin** to the
   **Allowed origins** list — including `http://localhost:5173` for local
   development. (These are HIKO-side CORS/session allowances, not Shopify
   redirect URIs, so `http://localhost` is fine.)

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
  config-server="https://signin.hiko.software">
</hiko-signin>

<script type="module">
  import "@hiko/signin-headless/element"; // registers <hiko-signin>
</script>
```

After login, query customer data through the broker BFF:

```js
const el = document.querySelector("hiko-signin");
const data = await el._auth.query("{ customer { firstName emailAddress { emailAddress } } }");
```

### Programmatic SDK

```js
import { createHeadlessAuth } from "@hiko/signin-headless";

const auth = createHeadlessAuth({
  shop: "your-shop.myshopify.com",
  configServer: "https://signin.hiko.software", // optional, this is the default
});

await auth.loadConfig();          // providers + appearance from the HIKO server
auth.login("google");             // → redirects to the HIKO broker → Shopify
await auth.handleCallback();       // on the redirect-back page: exchanges broker code
                                   // for an opaque session token (in-memory)
await auth.query("{ customer { firstName } }"); // BFF: broker proxies to Customer Account API
await auth.logout();
```

Exports: `createHeadlessAuth`, `memoryTokenStore`, `registerHikoSignin`, and the
side-effect `@hiko/signin-headless/element` entry (registers `<hiko-signin>`).

---

## Getting the config values

The storefront only needs two values. The Customer Account API client id, secret,
and shop id are entered by the **merchant** in the HIKO admin (one-time) and are
never exposed to the storefront.

| Attribute / env var | What it is | Where to get it |
| --- | --- | --- |
| `shop` / `VITE_SHOP` | Store domain `*.myshopify.com` | Shopify admin → Settings → Domains, or your admin URL (`admin.shopify.com/store/<handle>`) |
| `config-server` / `VITE_CONFIG_SERVER` | HIKO server (broker + config) | `https://signin.hiko.software` (default; only change if you self-host HIKO) |

> **Merchant-only (entered in HIKO admin, not in the storefront):** Customer
> Account API Client ID, Client Secret, and numeric Shop ID — see
> [One-time merchant setup](#one-time-merchant-setup-hiko-admin) above.

---

## Run locally

The package ships a runnable demo (`index.html`) served by Vite:

```bash
cp .env.example .env     # set VITE_SHOP and VITE_CONFIG_SERVER
npm install
npm run dev              # serves the demo at http://localhost:5173
```

`npm run dev` reads `.env` and mounts `<hiko-signin>` with your values. The
**whoami** button calls `el._auth.query(...)` to show the logged-in customer.

**No tunnel needed.** Because all OAuth happens on the HIKO server, `localhost`
works fine as the storefront origin. Just make sure the merchant has added
`http://localhost:5173` to the **Allowed origins** in the HIKO admin (step 4
of the one-time setup above).

---

## How it works

```
<hiko-signin> (this module)
   │  loadConfig() → GET <config-server>/headless/config?shop=…  (providers/appearance)
   │  click a provider → POST <config-server>/headless/start     (broker begins OAuth)
   ▼
HIKO signin server (broker)
   │  performs PKCE against Shopify Customer Account API (server-side)
   │  Shopify → social login via HIKO's OIDC IdP → customer authenticates
   │  callback → broker exchanges code → Shopify tokens (stay on server)
   │  broker issues opaque fragment session token → redirect back to storefront
   ▼
storefront redirect-back page
   │  auth.handleCallback() → stores opaque session token in-memory
   ▼
el._auth.query(…)
   │  → POST <config-server>/headless/customer  (BFF, Authorization: Bearer <session>)
   │  broker proxies GraphQL to Customer Account API with its server-held token
   ▼
Customer Account API GraphQL response → back to browser
```

---

## Security

Shopify Customer Account API tokens live on the **HIKO server** — the browser
holds only an opaque session token (in-memory, never written to
`localStorage` or cookies). This gives stronger XSS resistance than a
browser-side PKCE integration. A strict **Content-Security-Policy** on your
storefront is still recommended to protect the session token from script
injection.

---

## License

MIT
