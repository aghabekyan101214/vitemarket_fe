/**
 * Backend theme tokens → CSS custom properties. Nothing from the API reaches CSS without
 * validation: every color must be a hex color and every enum a known value, otherwise the
 * base default is used for that field.
 */
import type { HeaderStyle, ProductCardStyle, Radius, ThemeColors, ThemeTokens } from "@/types/api";

/** Mirror of backend `DEFAULT_THEME`, used when a site has no theme or a value is invalid. */
export const DEFAULT_TOKENS: ThemeTokens = {
  colors: {
    primary: "#111827",
    primary_foreground: "#FFFFFF",
    secondary: "#F3F4F6",
    accent: "#2563EB",
    background: "#FFFFFF",
    foreground: "#111827",
    muted: "#6B7280",
    border: "#E5E7EB",
  },
  fonts: {
    heading: { family: "Inter", weights: [400, 700], source: "google" },
    body: { family: "Inter", weights: [400, 700], source: "google" },
  },
  radius: "md",
  header_style: "minimal",
  product_card_style: "bordered",
};

export const RADIUS_VALUES: Record<Radius, string> = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "1rem",
  full: "9999px",
};

const HEX_RE = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const HEADER_STYLES: readonly HeaderStyle[] = ["minimal", "centered", "split"];
const CARD_STYLES: readonly ProductCardStyle[] = ["plain", "bordered", "elevated"];
const COLOR_KEYS = Object.keys(DEFAULT_TOKENS.colors) as (keyof ThemeColors)[];
const FONT_SOURCES = ["google", "system", "self_hosted"] as const;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value);
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function sanitizeFont(value: unknown, fallback: ThemeTokens["fonts"]["heading"]): ThemeTokens["fonts"]["heading"] {
  const v = (value ?? {}) as Partial<ThemeTokens["fonts"]["heading"]>;
  const family = typeof v.family === "string" && /^[\w \-]{1,100}$/.test(v.family) ? v.family : fallback.family;
  return {
    family,
    weights: Array.isArray(v.weights) ? v.weights.filter((w) => Number.isInteger(w)) : fallback.weights,
    source: pick(v.source, FONT_SOURCES, "google"),
  };
}

/** Validated tokens, field by field (invalid → base default). */
export function sanitizeTokens(input: unknown): ThemeTokens {
  const t = (input ?? {}) as Partial<ThemeTokens>;
  const colors = (t.colors ?? {}) as Partial<ThemeColors>;
  const fonts = (t.fonts ?? {}) as Partial<ThemeTokens["fonts"]>;
  return {
    colors: Object.fromEntries(
      COLOR_KEYS.map((k) => [k, isHexColor(colors[k]) ? colors[k] : DEFAULT_TOKENS.colors[k]]),
    ) as ThemeColors,
    fonts: {
      heading: sanitizeFont(fonts.heading, DEFAULT_TOKENS.fonts.heading),
      body: sanitizeFont(fonts.body, DEFAULT_TOKENS.fonts.body),
    },
    radius: pick(t.radius, Object.keys(RADIUS_VALUES) as Radius[], DEFAULT_TOKENS.radius),
    header_style: pick(t.header_style, HEADER_STYLES, DEFAULT_TOKENS.header_style),
    product_card_style: pick(t.product_card_style, CARD_STYLES, DEFAULT_TOKENS.product_card_style),
  };
}

export interface FontStacks {
  heading: string;
  body: string;
}

/** CSS custom properties for a site. `fonts` are already-safe stacks from the font registry. */
export function themeVariables(tokens: ThemeTokens, fonts: FontStacks): Record<string, string> {
  const c = tokens.colors;
  return {
    "--site-primary": c.primary,
    "--site-primary-foreground": c.primary_foreground,
    "--site-secondary": c.secondary,
    "--site-accent": c.accent,
    "--site-background": c.background,
    "--site-foreground": c.foreground,
    "--site-muted": c.muted,
    "--site-border": c.border,
    "--site-radius": RADIUS_VALUES[tokens.radius],
    "--site-font-heading": fonts.heading,
    "--site-font-body": fonts.body,
  };
}

export function themeCss(tokens: ThemeTokens, fonts: FontStacks): string {
  const body = Object.entries(themeVariables(tokens, fonts))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  // Values are hex colors, enum-mapped lengths and registry font stacks; `<` can't occur,
  // but escape it anyway so this string can never close the <style> element.
  return `:root{${body}}`.replace(/</g, "\\3c ");
}
