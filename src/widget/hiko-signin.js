import { LitElement, html } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { styles } from "./styles.js";
import { providerDisplay, pickIconMark, isLightColor } from "./icons.js";
import { sanitizeLabelHtml, decodeBasicEntities } from "./sanitize.js";
import { logger } from "./logger.js";
import { DEFAULT as I18N_DEFAULT, resolveMessages } from "./i18n.js";

export class HikoSignin extends LitElement {
  static properties = {
    endpoint: { type: String },
    loginUrl: { type: String, attribute: "login-url" },
    preview: { type: Boolean },
    // Opt-in: self-fetch config from /config when none is provided. Only the
    // standalone /apps/signin page sets this. The storefront widget leaves it
    // off — the shop metafield is its sole config source, so an empty metafield
    // renders nothing instead of firing a (proxy-404-prone) /config request.
    fetchConfig: { type: Boolean, attribute: "fetch-config" },
    config: { attribute: false },
    _error: { state: true },
    _emailLoading: { state: true },
    _socialLoading: { state: true },
    _marketingOptIn: { state: true },
    _consentChecked: { state: true },
    _consentError: { state: true },
    _t: { state: true },
  };

  static styles = styles;
  static transportFactory = null; // set by defineHikoSignin(); (el) => Transport

  constructor() {
    super();
    this.endpoint = "/apps/signin";
    this.loginUrl = "";
    this.preview = false;
    this.fetchConfig = false;
    this.config = null;
    this._error = null;
    this._emailLoading = false;
    this._socialLoading = null; // provider name while its redirect is starting
    this._marketingOptIn = false;
    this._consentChecked = false;
    this._consentError = null;
    this._t = I18N_DEFAULT; // English baseline; localized lazily (see _loadI18n)
    this._transport = null;
    this._navigate = (url) => { window.location.assign(url); };
    // The social/email handlers keep the spinner on while navigating away to
    // login. When the user hits Back, the page is restored from the bfcache with
    // that state intact — a stuck spinner. Clear it on a bfcache restore.
    this._onPageShow = (e) => {
      if (!e.persisted) return;
      this._socialLoading = null;
      this._emailLoading = false;
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("pageshow", this._onPageShow);
    this._transport = HikoSignin.transportFactory
      ? HikoSignin.transportFactory(this)
      : null;
    if (!this.config && !this.preview && this.fetchConfig) this._loadConfig();
    this._loadI18n();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("pageshow", this._onPageShow);
  }

  // Seed the opt-in checkbox from the merchant's setting whenever config lands:
  // pre-checked only when marketing is enabled AND defaultChecked (default true).
  // When marketing is off there's no checkbox, so the opt-in stays false. User
  // toggles after that persist (config doesn't change again on the storefront).
  willUpdate(changed) {
    if (changed.has("config")) {
      const m = this.config?.marketing;
      this._marketingOptIn = m?.enabled === true && m?.defaultChecked !== false;
      // Terms-consent box: pre-ticked per defaultChecked when enabled. Shoppers
      // can untick it, which then blocks sign-in (see _consentOk).
      const c = this.config?.consent;
      this._consentChecked = c?.enabled === true && c?.defaultChecked !== false;
    }
  }

  // Resolve the widget strings: the active-locale strings the Liquid block inlines
  // (`messages`, via Shopify's `t` filter — no fetch), plus any merchant overrides
  // from the published config (keyed by storefront locale).
  async _loadI18n() {
    const win = typeof window !== "undefined" ? window.__hikoSignin : null;
    const injected = this.config?.messages || win?.messages || null;
    const locale = this.config?.i18nLocale || win?.i18nLocale || "en";
    const overridesByLocale = this.config?.widgetText || win?.config?.widgetText || null;
    if (!injected && !overridesByLocale) return; // English default, no overrides — nothing to do
    const messages = await resolveMessages({ injected, locale, overridesByLocale });
    if (messages !== I18N_DEFAULT) this._t = messages;
  }

  async _loadConfig() {
    try {
      this.config = await this._transport.getConfig();
    } catch {
      logger.error("config load failed");
      this._error = this._t.errorUnavailable;
    }
  }

  // Hand the freshly minted hint to the broker via a first-party /oidc/prime hop
  // so it survives Shopify's customer-accounts redirect (which strips
  // login_hint). prime stores it in a first-party cookie; /oidc/authorize then
  // reads the cookie and continues straight to the provider — no second sign-in
  // page. Falls back to the legacy direct navigation when the broker origin
  // isn't in the published config yet (safe during rollout).
  _continueToLogin(login_hint) {
    const appOrigin = this.config?.appOrigin;
    if (appOrigin && this.loginUrl) {
      // prime's open-redirect guard requires an absolute https URL. loginUrl is
      // usually Shopify's root-relative routes.account_login_url (/account/login),
      // so resolve it against the storefront origin the customer is on (an
      // already-absolute loginUrl passes through unchanged).
      const next = new URL(this.loginUrl, window.location.origin).href;
      this._navigate(`${appOrigin.replace(/\/$/, "")}/oidc/prime?hint=${encodeURIComponent(login_hint)}&next=${encodeURIComponent(next)}`);
      return;
    }
    const sep = this.loginUrl.includes("?") ? "&" : "?";
    this._navigate(`${this.loginUrl}${sep}login_hint=${encodeURIComponent(login_hint)}`);
  }

  // Tri-state opt-in signal sent to /select: the shopper's choice (true/false)
  // only when the checkbox is actually shown (marketing enabled), else null so
  // the server leaves consent untouched. Never report a choice the shopper
  // wasn't given.
  get _optInSignal() {
    return this.config?.marketing?.enabled ? this._marketingOptIn : null;
  }

  // Mandatory terms-consent gate. When the consent box is enabled but unticked,
  // block sign-in and surface a red error under it. Returns true when OK to go on.
  _consentOk() {
    if (this.config?.consent?.enabled && !this._consentChecked) {
      this._consentError = this._t.consentRequired;
      return false;
    }
    this._consentError = null;
    return true;
  }

  // Transport seam contract for selectSocial / selectEmail:
  //   • App-proxy transport: returns { login_hint } — the widget then calls
  //     _continueToLogin(login_hint) to navigate to the OIDC flow.
  //   • Self-navigating transport (e.g. HeadlessTransport): performs its own
  //     navigation internally and returns nothing (or an object without
  //     login_hint). The widget detects the absence of login_hint and skips
  //     _continueToLogin, leaving the transport in full control of navigation.
  async _onSocial(provider) {
    if (this._socialLoading) return; // ignore re-clicks while a redirect is starting
    this._error = null;
    if (!this._consentOk()) return; // mandatory terms consent must be ticked first
    this._socialLoading = provider; // disables the buttons + shows a spinner on this one
    logger.info("social select:", provider);
    try {
      const result = await this._transport.selectSocial(provider, null, this._optInSignal);
      const login_hint = result?.login_hint;
      this.dispatchEvent(new CustomEvent("hiko-signin:redirect", { detail: { provider, login_hint }, bubbles: true, composed: true }));
      if (!this.preview && login_hint) {
        logger.debug("redirecting to login");
        this._continueToLogin(login_hint);
        return; // navigating away — keep the loading state until the page changes
      }
      this._socialLoading = null; // preview: no navigation, restore the buttons
    } catch (e) {
      logger.error("social select failed:", e?.code || e?.message);
      this._error = e?.code === "provider_not_enabled" ? this._t.errorMethod : this._t.errorStart;
      this._socialLoading = null;
      this.dispatchEvent(new CustomEvent("hiko-signin:error", { detail: { code: e?.code }, bubbles: true, composed: true }));
    }
  }

  async _onEmailSubmit(e) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this._error = this._t.errorEmail;
      return;
    }
    this._error = null;
    if (!this._consentOk()) return; // mandatory terms consent must be ticked first
    this._emailLoading = true;
    try {
      const result = await this._transport.selectEmail(email, this._optInSignal);
      const login_hint = result?.login_hint;
      this.dispatchEvent(new CustomEvent("hiko-signin:redirect", { detail: { kind: "email", login_hint }, bubbles: true, composed: true }));
      if (!this.preview && login_hint) {
        this._continueToLogin(login_hint);
        return; // navigating away — keep the spinner until the page changes
      }
      this._emailLoading = false; // preview: no navigation, restore the button
    } catch {
      this._error = this._t.errorStart;
      this._emailLoading = false;
    }
  }

  render() {
    const providers = this.config?.providers ?? [];
    const st = this.config?.styles ?? {};
    const radius = { pill: "999px", rounded: "8px", square: "0" }[st.shape] ?? "8px";
    const theme = ["color", "dark", "light"].includes(st.theme) ? st.theme : "color";
    const format = ["icontext", "center", "right", "text", "icon"].includes(st.format) ? st.format : "icontext";
    const btn = { small: "0.5rem 0.75rem/0.875rem/0.3rem", medium: "0.7rem 1rem/1rem/0.5rem", large: "0.95rem 1.25rem/1.125rem/0.7rem" }[st.buttonSize] ?? "0.7rem 1rem/1rem/0.5rem";
    const [btnPad, btnFont, iconPad] = btn.split("/");
    // Optional explicit overrides (blank/0 = inherit): a px icon size wins over
    // the small/medium/large preset.
    const icoSize = st.iconPx ? `${st.iconPx}px` : ({ small: "16px", medium: "20px", large: "26px" }[st.iconSize] ?? "20px");
    // Per-button overrides applied inline (highest specificity → beat the theme):
    // background colour, border, and a fixed button height.
    let btnOverride = "";
    // A custom background sets the button colour AND a contrasting text colour, so
    // the label and any monochrome/currentColor icon stay legible.
    if (st.bgColor) btnOverride += `background:${st.bgColor};color:${isLightColor(st.bgColor) ? "#1a1a1a" : "#ffffff"};`;
    if (st.borderWidth) btnOverride += `border:${st.borderWidth}px solid ${st.borderColor || "#cccccc"};`;
    if (st.buttonHeight) btnOverride += `min-height:${st.buttonHeight}px;`;
    // Email field is the OTP entry point — hide it (and the divider that sets it
    // off from the social buttons) when email one-time code is turned off.
    const showEmail = this.config?.passwordless?.otp !== false;
    const showDivider = st.divider !== false && showEmail;
    // Label typography overrides (blank = inherit the button-size preset).
    const lblVars = `${st.labelPx ? `;--hs-lbl-size:${st.labelPx}px` : ""}${st.labelWeight ? `;--hs-lbl-weight:${st.labelWeight}` : ""}${st.labelColor ? `;--hs-lbl-color:${st.labelColor}` : ""}`;
    const vars = `--hs-radius:${radius};--hs-btn-pad:${btnPad};--hs-btn-font:${btnFont};--hs-icon-pad:${iconPad};--hs-ico-size:${icoSize}${lblVars}`;
    return html`
      <div class="hs" part="root" data-theme=${theme} data-format=${format} style=${vars}>
        ${this._error ? html`<div class="hs-error" role="alert">${this._error}</div>` : null}
        <div class="hs-social">
          ${providers.map((name) => {
            const d = providerDisplay(name);
            // The icon mark, with a built-in contrast guarantee: a merchant-picked
            // variant is honored unless it would blend into the button background,
            // in which case pickIconMark falls back to a theme-appropriate visible
            // mark (see icons.js). "default"/unset → the theme-appropriate mark.
            // A custom background overrides the button colour, so the contrast
            // check uses it to keep the icon visible.
            const mark = pickIconMark(name, this.config?.providerIcons?.[name], theme, format, st.bgColor || null);
            // Localized "Continue with {brand}" — prefix translates, brand stays.
            const label = (this._t.continueWith || "{provider}").replace("{provider}", d.brand);
            const loading = this._socialLoading === name;
            return html`<button class="hs-btn" type="button" data-provider=${name} title=${label}
              ?disabled=${this._socialLoading != null} aria-busy=${loading ? "true" : "false"}
              style="--c:${d.color};${btnOverride}" @click=${() => this._onSocial(name)}>
              ${loading
                ? html`<span class="hs-spinner hs-spinner-btn" aria-hidden="true"></span>`
                : (mark ? html`<span class="hs-ico">${unsafeSVG(mark)}</span>` : null)}<span class="hs-lbl">${label}</span>
            </button>`;
          })}
        </div>
        ${providers.length && showDivider ? html`<div class="hs-divider" role="separator">${this._t.or}</div>` : null}
        ${showEmail
          ? html`<form class="hs-email" @submit=${this._onEmailSubmit}>
          <div class="hs-email-field">
            <input type="email" name="email" placeholder=${this._t.emailPlaceholder} autocomplete="username" required ?disabled=${this._emailLoading} />
            <button type="submit" aria-label=${this._t.continue} ?disabled=${this._emailLoading}>
              ${this._emailLoading ? html`<span class="hs-spinner" aria-hidden="true"></span>` : "→"}
            </button>
          </div>
        </form>`
          : null}
        ${this.config?.marketing?.enabled ? html`
          <label class="hs-marketing">
            <input type="checkbox" name="hs-marketing" .checked=${this._marketingOptIn}
              @change=${(e) => { this._marketingOptIn = e.target.checked; }} />
            <span>${unsafeHTML(sanitizeLabelHtml(decodeBasicEntities(this._t.marketingOptIn)))}</span>
          </label>` : null}
        ${this.config?.consent?.enabled ? html`
          <label class="hs-marketing hs-consent">
            <input type="checkbox" name="hs-consent" .checked=${this._consentChecked}
              @change=${(e) => { this._consentChecked = e.target.checked; if (e.target.checked) this._consentError = null; }} />
            <span>${unsafeHTML(sanitizeLabelHtml(decodeBasicEntities(this._t.consentLabel)))}</span>
          </label>
          ${this._consentError ? html`<div class="hs-consent-error" role="alert">${this._consentError}</div>` : null}` : null}
      </div>`;
  }

}

export function defineHikoSignin(transportFactory) {
  HikoSignin.transportFactory = transportFactory;
  if (!customElements.get("hiko-signin")) customElements.define("hiko-signin", HikoSignin);
}
