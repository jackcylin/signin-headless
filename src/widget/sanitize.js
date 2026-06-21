// Conservative allowlist sanitizer for the two merchant-authored HTML widget
// labels (marketing opt-in + terms consent). Shared by the storefront widget
// render and the admin live preview, so it's pure string-only (no DOM / Node
// APIs) and works isomorphically.
//
// Threat model: the label is set ONLY by the authenticated merchant and rendered
// on the merchant's OWN storefront — a merchant could already inject anything via
// their theme. So this is defense-in-depth (avoid accidents / obvious XSS), not a
// hard trust boundary: it drops <script>/<style>, any tag outside the allowlist,
// all event handlers, and unsafe URL schemes, keeping only basic formatting +
// safe links.

const ALLOWED_TAGS = new Set(["a", "b", "strong", "i", "em", "u", "br", "span", "p"]);

// Shopify's `t` (translate) Liquid filter HTML-escapes its output, so an
// HTML-valued widget label inlined via {{ 'key' | t }} reaches the widget as
// `&lt;a href=&quot;…&quot;&gt;…`. Decode the basic entities Liquid emits
// (&, <, >, ", ') so the merchant's intended HTML is restored; the sanitizer
// then re-validates it. On already-real HTML (merchant overrides published as
// raw via `| json`, the shipped asset, or the English default) it's a no-op
// apart from resolving a stray literal entity — fine for label text. `&amp;` is
// decoded LAST so `&amp;lt;` → `&lt;` rather than `<`.
export function decodeBasicEntities(input) {
  return String(input ?? "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

// Allow http(s)/mailto and scheme-less (relative, anchor) URLs; reject
// javascript:, data:, etc. A scheme is the part before the first ":" that comes
// before any "/", "?" or "#".
function safeHref(raw) {
  const href = String(raw || "").trim();
  if (!href) return null;
  const schemeMatch = href.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== "http" && scheme !== "https" && scheme !== "mailto") return null;
  }
  // Reject control characters that could smuggle a scheme (e.g. "java\tscript:").
  // Checked by char code rather than a control-char regex (avoids no-control-regex).
  for (let i = 0; i < href.length; i++) {
    if (href.charCodeAt(i) < 0x20) return null;
  }
  return href;
}

function attr(tagBody, name) {
  const m = tagBody.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4] ?? "") : null;
}

export function sanitizeLabelHtml(input) {
  let html = String(input ?? "");
  // Strip script/style blocks (with content) outright.
  html = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  // Rewrite every tag: keep allowlisted ones (attributes stripped, except safe
  // href/target/rel on <a>); drop everything else, preserving inner text.
  return html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (_m, slash, rawName, body) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (slash) return `</${name}>`;
    if (name === "br") return "<br>";
    if (name === "a") {
      const href = safeHref(attr(body, "href"));
      const target = attr(body, "target") === "_blank" ? "_blank" : null;
      const parts = ["a"];
      if (href) parts.push(`href="${href.replace(/"/g, "&quot;")}"`);
      if (target) parts.push(`target="_blank"`, `rel="noopener noreferrer"`);
      return `<${parts.join(" ")}>`;
    }
    return `<${name}>`;
  });
}
