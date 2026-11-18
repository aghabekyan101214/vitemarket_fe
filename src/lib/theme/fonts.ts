/**
 * Backend font token → CSS font stack (pure; the `next/font` objects live in
 * `config/fonts.ts`). Unknown families fall back to a system stack with a warning.
 */
import type { ThemeFont } from "@/types/api";

export const SANS_STACK =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const SERIF_STACK = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

export interface RegisteredFont {
  /** next/font class that defines `variable` on the element it is applied to. */
  className: string;
  /** CSS variable holding the self-hosted family + metric-adjusted fallback. */
  variable: string;
  fallback: string;
}

export interface ResolvedFont {
  stack: string;
  className: string | null;
}

export function resolveFont(
  font: ThemeFont,
  registry: Readonly<Record<string, RegisteredFont>>,
  warn: (msg: string) => void = (m) => console.warn(m),
): ResolvedFont {
  const family = font.family;
  if (font.source === "system") {
    const safe = family.replace(/[^\w \-]/g, "");
    return { stack: safe ? `"${safe}", ${SANS_STACK}` : SANS_STACK, className: null };
  }
  const hit = registry[family];
  if (hit) return { stack: `var(${hit.variable}), ${hit.fallback}`, className: hit.className };
  warn(`[fonts] "${family}" (${font.source ?? "google"}) is not in config/fonts.ts; using the system stack`);
  return { stack: SANS_STACK, className: null };
}
