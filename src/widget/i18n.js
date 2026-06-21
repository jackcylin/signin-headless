// Storefront widget i18n. English is the built-in default (inlined in the main
// bundle, no network cost). Other locales ship as theme-extension locale files
// (extensions/theme-extension/locales/<lang>.json) that Shopify's `t` filter
// inlines into the Liquid block as `messages` — so non-English copy never bloats
// the bundle and there is no runtime fetch. Per-shop overrides (the Translations
// page, published in the metafield) layer on top and can cover any language.
export const DEFAULT = {
  errorUnavailable: "Sign-in is temporarily unavailable",
  errorMethod: "That sign-in method isn't available.",
  errorStart: "Couldn't start sign-in. Please try again.",
  errorEmail: "Please enter a valid email address.",
  emailPlaceholder: "Email",
  or: "or", // divider label between social buttons and email sign-in
  continue: "Continue",
  signIn: "Sign in",
  close: "Close",
  continueWith: "Continue with {provider}", // {provider} = brand name (kept as-is)
  marketingOptIn: "Email me with news and offers", // HTML allowed (sanitized)
  // Terms-consent checkbox. HTML allowed (sanitized) so merchants can link their
  // policy pages. Shown only when consent.enabled; sign-in is blocked until ticked.
  consentLabel: 'I agree to the <a href="/policies/terms-of-service" target="_blank" rel="noopener">Terms of Service</a> and <a href="/policies/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a>',
  // Red error shown when the consent box is required but left unchecked (plain text).
  consentRequired: "Please agree to the terms to continue.",
};

// The effective widget strings: English default → the active-locale strings →
// the merchant's per-locale overrides (from the Translations page, published in
// the metafield). Returns DEFAULT unchanged when nothing localizes, so callers
// can skip a re-render. `overridesByLocale` is the `widgetText` map keyed by
// locale; `locale` is the resolved locale code (e.g. "zh-TW" or "en").
//
// The active-locale base is resolved without any network round-trip: Shopify's
// `t` filter emits the active language's strings (from
// extensions/theme-extension/locales/) into `injected`. English (or any locale
// the block didn't inline) resolves to DEFAULT, then overrides layer on top.
export function resolveMessages({ injected, locale, overridesByLocale }) {
  const base = hasStrings(injected) ? { ...DEFAULT, ...injected } : DEFAULT;
  const overrides = pickOverride(overridesByLocale, locale);
  if (!overrides || typeof overrides !== "object") return base;
  const clean = {};
  for (const [k, v] of Object.entries(overrides)) if (typeof v === "string" && v.trim()) clean[k] = v;
  return Object.keys(clean).length ? { ...base, ...clean } : base;
}

// True when `v` is a non-empty object with at least one string value — i.e. the
// block actually inlined locale strings (an empty `{}` falls through to fetch).
function hasStrings(v) {
  return !!v && typeof v === "object" && Object.values(v).some((s) => typeof s === "string" && s.length > 0);
}

// Find the override set for a locale: exact match, else the base language
// (e.g. "pt-BR" → "pt"). Lets merchant-added languages (beyond the built-in
// set) resolve from the shopper's storefront locale.
function pickOverride(map, locale) {
  if (!map || !locale) return null;
  if (map[locale]) return map[locale];
  const base = String(locale).split("-")[0];
  return map[base] || null;
}
