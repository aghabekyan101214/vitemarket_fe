/** WCAG 2.x contrast ratios for the theme color pairs that carry text. */
import type { ThemeColors } from "@/types/api";

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((x) => x + x).join("");
  const n = Number.parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

export const AA_NORMAL_TEXT = 4.5;

export interface ContrastIssue {
  pair: string;
  ratio: number;
}

export function checkContrast(colors: ThemeColors, min = AA_NORMAL_TEXT): ContrastIssue[] {
  const pairs: Array<[string, string, string]> = [
    ["foreground/background", colors.foreground, colors.background],
    ["primary_foreground/primary", colors.primary_foreground, colors.primary],
    ["muted/background", colors.muted, colors.background],
    ["foreground/secondary", colors.foreground, colors.secondary],
  ];
  return pairs
    .map(([pair, fg, bg]) => ({ pair, ratio: Math.round(contrastRatio(fg, bg) * 100) / 100 }))
    .filter((r) => r.ratio < min);
}
