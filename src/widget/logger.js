const LEVELS = { debug: 2, info: 3, warn: 4, error: 5 };

// Build a console-backed logger; methods below `level` become no-ops.
// Exported as a factory (for tests) and a default singleton whose level is
// baked in at build time from import.meta.env.VITE_LOG_LEVEL (default "error").
export function createLogger(level) {
  const lvl = LEVELS[(level || "").toLowerCase()] ? level.toLowerCase() : "error";
  const log = {};
  for (const method of Object.keys(LEVELS)) {
    log[method] =
      LEVELS[method] < LEVELS[lvl]
        ? () => {}
        : console[method].bind(console, `[hiko] ${method.toUpperCase()}:`);
  }
  return log;
}

export const logger = createLogger(import.meta.env?.VITE_LOG_LEVEL);
export { LEVELS };
