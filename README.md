# @hiko/signin-headless

Add Google, Facebook, and other social sign-in to a **headless** Shopify
storefront (React, Vue, Hydrogen, or plain HTML) with a single web component and
**no backend of your own**. `@hiko/signin-headless` drops the same
`<hiko-signin>` widget your Shopify theme already uses into any headless
storefront: it renders the providers you configured in your HIKO admin, runs the
entire login through the hosted HIKO broker, and lets you read the signed-in
customer — all from the browser, with the Shopify OAuth tokens kept on the
server.

It is the headless companion to **HIKO Social Login Plus**. Install that app,
configure your providers in its admin, and this module consumes that setup — you
write no OAuth code, run no server, and store no secrets.

- App Store: **[HIKO Social Login Plus](https://apps.shopify.com/hiko-ultimate-social-login)** (HIKO Software)
- Works from `localhost` with no tunnel. New customer accounts only.

---

## Quick start

```bash
npm install @hiko/signin-headless
```

```html
<!-- 1. Drop the component in. It renders the social buttons you configured. -->
<hiko-signin shop="your-shop.myshopify.com"></hiko-signin>

<script type="module">
  // 2. One import registers <hiko-signin>. No other setup.
  import "@hiko/signin-headless";

  const el = document.querySelector("hiko-signin");

  // 3. The customer is signed in when this fires (after the login redirect).
  el.addEventListener("hiko:login", async () => {
    const { customer } = await el.query(
      "{ customer { firstName lastName emailAddress { emailAddress } } }",
    );
    console.log("Signed in:", customer.firstName, customer.emailAddress.emailAddress);
  });

  el.addEventListener("hiko:logout", () => console.log("Signed out"));
</script>
```

That is the whole integration: the component renders your providers, redirects
through the broker to sign the customer in, returns to your page, and
`el.query(...)` reads customer data through the broker — no tokens, `shopId`, or
CORS setup on your side. `config-server` defaults to `https://signin.hiko.software`;
set it only if you self-host HIKO. See [Usage](#usage) for the full element API
(`el.login` / `el.logout` / `el.getToken` / `el.isLoggedIn`).

---

## Design principles

- **No backend for you to build or run.** Your storefront loads the
  `<hiko-signin>` web component and points it at the hosted HIKO server — you
  write no server code, run no OAuth backend, and store no secrets. A backend
  *does* exist and is required: it is the **HIKO broker** (`signin.hiko.software`,
  operated by HIKO), not something you stand up. Drop in the web component and
  you are done.
- **Broker model — the broker holds the Shopify tokens.** Login and token
  exchange run on the **HIKO server (broker)**, which holds and refreshes the
  Shopify Customer Account API tokens; the browser never performs OAuth/PKCE.
  After authentication the browser holds only an **opaque session token**
  (in-memory) and reads customer data through the broker's BFF (`el.query`) — so
  the Shopify token need never touch the browser. If you *do* need it
  client-side (e.g. to call the Customer Account API directly), `el.getToken()`
  fetches a copy from the broker on demand — an explicit opt-in that brings the
  access token into the browser.
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

1. **The store has [HIKO Social Login Plus](https://apps.shopify.com/hiko-ultimate-social-login) installed** and social providers
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

### Two separate OAuth clients

There are **two distinct OAuth clients** in this flow — don't confuse them:

1. **The Shopify Customer Account API client** (the Client ID / Secret above).
   This authenticates the **HIKO broker to Shopify** so it can run the customer
   login and read customer data. It is headless-specific and is what the steps
   above configure.
2. **The social-provider OAuth clients** — your own **Google / Facebook / LINE /
   TikTok** app credentials (each provider's own client id + secret). These are
   configured in the **provider settings** of the HIKO admin, exactly as for
   your Shopify *theme* storefront, and are **shared between the theme and
   headless flows** — there is nothing headless-specific to set up.

The headless login federates through the same HIKO sign-in step the theme widget
uses, so each social provider uses whatever you configured there: **your own
custom client id/secret if you entered one, otherwise HIKO's shared app.** If
social login already works on your theme storefront, it works in headless with
no extra provider configuration.

### Social-provider redirect URIs

When you register your **own** social OAuth app, the redirect URI you add in that
provider's console is **not your storefront** — it points back at HIKO (directly
or via Shopify's App Proxy). The HIKO admin shows the exact value per provider;
it is one of:

- **Default (most providers / HIKO's shared app):** the HIKO server itself —
  `https://signin.hiko.software/oidc/<provider>/callback`.
- **Your own Google client:** Google requires the redirect on *your* domain (for
  the branded consent screen), so HIKO uses the **Shopify App Proxy** —
  `https://<your-shop-domain>/apps/signin/google/callback`. Google redirects
  there and Shopify transparently forwards the request to the HIKO server.

Either way the social provider redirects to HIKO, never to the headless
storefront — only the **final** hop, after authentication succeeds, returns to
your page through the broker. This is the same redirect setup your theme
storefront already uses, so **headless needs nothing extra here**: register
whatever value the HIKO admin shows for each provider.

---

## Install

```bash
npm install @hiko/signin-headless
```

---

## Usage

### As a web component (any framework / plain HTML)

```html
<div id="mount"></div>

<script type="module">
  import "@hiko/signin-headless"; // registers <hiko-signin> and auto-calls registerHikoSignin()
  // — or —
  import "@hiko/signin-headless/element";

  const el = document.createElement("hiko-signin");
  el.setAttribute("shop", "your-shop.myshopify.com");
  el.setAttribute("config-server", "https://signin.hiko.software"); // optional, this is the default
  document.getElementById("mount").appendChild(el);

  // React to auth state changes via DOM events:
  el.addEventListener("hiko:login", async () => {
    const data = await el.query("{ customer { firstName emailAddress { emailAddress } } }");
    console.log(data.customer);
  });
  el.addEventListener("hiko:logout", () => {
    console.log("signed out");
  });
</script>
```

The element exposes the full auth API directly — no `el._auth` indirection needed:

| Method | Description |
| --- | --- |
| `el.isLoggedIn()` | Returns `true` when a session token is held in-memory |
| `el.login(provider?)` | Redirects to the HIKO broker for social or email-OTP login |
| `el.logout()` | Ends the session on the broker and clears the in-memory token |
| `el.query(graphql, vars?)` | Runs a Customer Account API GraphQL query through the broker BFF |
| `el.getToken()` | Returns `{ accessToken, expiresAt }` from the broker (server-held Shopify token) |
| `el.getSession()` | Returns the current broker session payload |

Events dispatched on the element (`bubbles: true, composed: true`):

| Event | When | `event.detail` |
| --- | --- | --- |
| `hiko:login` | Callback processed / token becomes present | `{ customer }` (non-null in popup mode; `null` in redirect mode) |
| `hiko:logout` | Token cleared (logout or 401) | — |
| `hiko:loginstart` | A provider or email login begins (fired immediately when `el.login()` is called) | `{ provider }` — the provider string (e.g. `"google"`) or `null` for email/OTP |
| `hiko:logincancel` | A popup login was closed/abandoned without completing (popup mode only) | `{ provider }` — same provider that was passed to `el.login()` |

### Popup mode

Set `mode="popup"` on the element to open a 480 × 720 popup window for the
OAuth handshake instead of redirecting the current page. The popup runs the
same HIKO broker flow and self-closes once the session is established, handing
the result back to the opener via `postMessage`.

```html
<hiko-signin shop="your-shop.myshopify.com" mode="popup"></hiko-signin>

<script type="module">
  import "@hiko/signin-headless";

  const el = document.querySelector("hiko-signin");

  el.addEventListener("hiko:login", (e) => {
    // In popup mode, customer data arrives immediately in event.detail —
    // no extra el.query() call needed.
    const customer = e.detail?.customer;
    console.log("Signed in:", customer?.firstName);
  });
</script>
```

Key behaviour:

- **Opt-in, backward-compatible.** The default (no `mode` attribute or
  `mode="redirect"`) is unchanged: a full-page redirect to the broker.
- **Graceful fallback.** If the browser blocks the popup (e.g. the call did
  not originate from a user gesture), the widget falls back to the standard
  full-page redirect automatically.
- **Secure relay.** The session token is passed from the popup to the opener
  via `postMessage` with `targetOrigin` set to `location.origin` (never `"*"`).
  The opener accepts a message only when all three hold: the origin matches, the
  source is the exact popup reference, and `data.type === "hiko:session"`.
- **Customer included.** `hiko:login` fires with `event.detail.customer`
  pre-populated (firstName, lastName, email) so you do not need a follow-up
  `el.query()` call in popup mode.

> **Note:** `createHeadlessAuth` is an internal module — it is no longer exported
> from the public entry point. The `<hiko-signin>` element is the sole public
> surface. Use `el.query()`, `el.getToken()`, etc. directly on the element.

Exports: `registerHikoSignin` (named), and the side-effect
`@hiko/signin-headless/element` entry (registers `<hiko-signin>`).

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

`npm run dev` reads `.env` and mounts `<hiko-signin>` with your values. Once
signed in, the demo shows the logged-in customer via `el.query(...)` — no
`el._auth` indirection.

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
el.query(…)
   │  → POST <config-server>/headless/customer  (BFF, Authorization: Bearer <session>)
   │  broker proxies GraphQL to Customer Account API with its server-held token
   ▼
Customer Account API GraphQL response → back to browser
```

---

## Security

The Shopify Customer Account API tokens **always** live on the **HIKO server** —
the broker holds and refreshes them (encrypted at rest) and keeps them even when
the browser asks for a copy. By default the browser holds only an opaque session
token (in-memory, never written to `localStorage` or cookies) and reads customer
data through the broker's BFF (`el.query`). This gives stronger XSS resistance
than a browser-side PKCE integration.

`el.getToken()` is an explicit opt-out of that isolation: it returns a *copy* of
the live Customer Account API access token to the browser so you can call the
Customer Account API directly (the broker's own copy stays server-side). Use it only when you need direct API access — while the
browser holds that token it carries the same XSS exposure as any browser-side
token. A strict **Content-Security-Policy** on your storefront is recommended
either way (it also protects the session token from script injection).

---

## License

MIT
