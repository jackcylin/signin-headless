import { css } from "lit";

export const styles = css`
  :host { display: block; font-family: system-ui, -apple-system, sans-serif; color: #111; }
  .hs { max-width: 360px; margin: 0 auto; }
  .hs-error { color: #b91c1c; font-size: 0.875rem; margin: 0 0 0.75rem; }
  .hs-social { display: flex; flex-direction: column; gap: 0.5rem; }
  /* Button shape (--hs-radius), theme (data-theme) and format (data-format) are merchant-set. */
  .hs-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: var(--hs-btn-pad, 0.7rem 1rem); border: 0; border-radius: var(--hs-radius, 8px); color: #fff; background: var(--c, #444); font-size: var(--hs-btn-font, 1rem); cursor: pointer; overflow: hidden; transition: transform 0.06s ease, filter 0.15s ease, opacity 0.15s ease; }
  /* White chip behind the (full-color) brand mark so it stays visible on any button. */
  .hs-btn .hs-ico { display: inline-flex; flex: 0 0 auto; background: #fff; border-radius: 6px; padding: 3px; line-height: 0; }
  .hs-btn .hs-ico svg { display: block; width: var(--hs-ico-size, 20px); height: var(--hs-ico-size, 20px); }
  .hs-btn .hs-lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--hs-lbl-size, inherit); font-weight: var(--hs-lbl-weight, inherit); color: var(--hs-lbl-color, inherit); }
  .hs[data-theme="dark"] .hs-btn { background: #1a1a1a; color: #fff; }
  .hs[data-theme="light"] .hs-btn { background: #fff; color: var(--c, #111); border: 1px solid #e5e7eb; }
  .hs-btn:hover { filter: brightness(0.95); }
  /* Tactile feedback on click + loading state while the redirect is starting. */
  .hs-btn:active { transform: scale(0.97); }
  .hs-btn:disabled { cursor: default; }
  .hs-btn:disabled:hover { filter: none; }
  .hs-btn:disabled:not([aria-busy="true"]) { opacity: 0.55; }
  /* Spinner sized like the brand mark; currentColor adapts to each theme/button. */
  .hs-btn .hs-spinner-btn { flex: 0 0 auto; width: var(--hs-ico-size, 20px); height: var(--hs-ico-size, 20px); border: 2px solid color-mix(in srgb, currentColor 30%, transparent); border-top-color: currentColor; }

  /* Button formats */
  .hs[data-format="icontext"] .hs-btn { justify-content: flex-start; }
  .hs[data-format="center"] .hs-btn { justify-content: center; }
  .hs[data-format="right"] .hs-btn { justify-content: space-between; }
  .hs[data-format="right"] .hs-btn .hs-ico { order: 2; }
  .hs[data-format="text"] .hs-btn { justify-content: center; }
  .hs[data-format="text"] .hs-btn .hs-ico { display: none; }
  /* Icon-only: square buttons ranked horizontally; theme background + shape
     radius still apply (inherited), so a colored "pill" button reads as a circle. */
  .hs[data-format="icon"] .hs-social { flex-direction: row; flex-wrap: wrap; justify-content: center; }
  /* Icon-only: mark sits directly on the themed/shaped button (no chip). Light
     theme passes the full-color mark; Color/Dark pass a white (currentColor)
     mark. Padding scales with button size; the mark with icon size. */
  .hs[data-format="icon"] .hs-btn { justify-content: center; padding: var(--hs-icon-pad, 0.5rem); aspect-ratio: 1; box-sizing: border-box; }
  .hs[data-format="icon"] .hs-btn .hs-ico { background: transparent; padding: 0; }
  .hs[data-format="icon"] .hs-btn .hs-lbl { display: none; }
  .hs-divider { display: flex; align-items: center; gap: 0.75rem; color: #6b7280; margin: 1rem 0; font-size: 0.875rem; }
  .hs-divider::before, .hs-divider::after { content: ""; flex: 1; height: 1px; background: #e5e7eb; }
  /* Email field: a single bordered box with a trailing accent arrow button. */
  .hs-email { display: flex; }
  .hs-email-field { display: flex; align-items: center; flex: 1; gap: 4px; padding: 4px 4px 4px 0; border: 1px solid #8a8a8a; border-radius: 8px; background: #fff; }
  .hs-email-field:focus-within { border-color: #1a1a1a; }
  .hs-email-field input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: #1a1a1a; padding: 0.55rem 0.75rem; font-size: 0.95rem; }
  .hs-email-field button { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border: 0; border-radius: 6px; background: #c7d6b5; color: #1a1a1a; font-size: 1.15rem; line-height: 1; cursor: pointer; }
  .hs-email-field button:hover { filter: brightness(0.96); }
  .hs-email-field button:disabled { cursor: default; filter: none; }
  .hs-spinner { width: 1rem; height: 1rem; border: 2px solid rgba(26,26,26,0.3); border-top-color: #1a1a1a; border-radius: 50%; animation: hs-spin 0.6s linear infinite; }
  @keyframes hs-spin { to { transform: rotate(360deg); } }
  .hs-status { color: #4b5563; font-size: 0.9rem; margin-top: 0.75rem; }
  .hs-marketing { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; margin-top: 0.5rem; cursor: pointer; }
  .hs-marketing a { color: inherit; text-decoration: underline; }
  /* Consent label can wrap (terms + privacy links), so top-align the checkbox. */
  .hs-consent { align-items: flex-start; }
  .hs-consent input { margin-top: 0.15rem; }
  .hs-consent-error { color: #b91c1c; font-size: 0.8rem; margin-top: 0.35rem; }
`;
