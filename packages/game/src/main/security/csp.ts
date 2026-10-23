export interface CspOptions {
  /**
   * Origin of the Vite dev server (for example `http://localhost:5173`), set only by `pnpm dev`.
   * It relaxes the policy just enough for hot reload. Never set in production.
   */
  readonly devServerOrigin?: string;
}

/**
 * Content Security Policy of the renderer (ADR 0009). Nothing is allowed unless listed:
 * no inline script, no `eval`, no remote origin, no plugin, no framing.
 *
 * Pixi's shader code generation normally uses `new Function`; the renderer imports
 * `pixi.js/unsafe-eval` instead of this policy allowing `'unsafe-eval'`.
 */
export function buildContentSecurityPolicy(options: CspOptions = {}): string {
  const dev = options.devServerOrigin;
  const devSources = dev === undefined ? [] : [dev, dev.replace(/^http/, "ws")];

  const directives: Record<string, readonly string[]> = {
    "default-src": ["'none'"],
    // Hot reload injects an inline preamble script and inline styles, in dev only.
    "script-src": ["'self'", ...(dev === undefined ? [] : ["'unsafe-inline'"])],
    "style-src": ["'self'", ...(dev === undefined ? [] : ["'unsafe-inline'"])],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...devSources],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'none'"],
    "form-action": ["'none'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}
