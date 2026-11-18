import { describe, expect, it, vi } from "vitest";
import { CenteredHeader, HEADER_VARIANTS, MinimalHeader, SplitHeader } from "@/components/layouts/Header";
import { CARD_STYLES } from "@/components/products/ProductCard";
import { designIdForSite } from "@/config/designs";
import { base } from "@/designs/base";
import { HeroSection as HeroA } from "@/designs/design-a/HeroSection";
import { FeaturesSection as FeaturesB } from "@/designs/design-b/FeaturesSection";
import { getDesign, mergeDesign } from "@/designs/registry";
import { checkContrast, contrastRatio } from "@/lib/theme/contrast";
import { DEFAULT_TOKENS, sanitizeTokens, themeCss, themeVariables } from "@/lib/theme/css-vars";
import { resolveFont, SANS_STACK, SERIF_STACK } from "@/lib/theme/fonts";
import * as fx from "./fixtures";

const deTokens = fx.config("nordic-home-de", "de").theme!.tokens;
const frTokens = fx.config("nordic-home-fr", "fr").theme!.tokens;
const fonts = { heading: "var(--h)", body: "var(--b)" };

describe("tokens → CSS variables", () => {
  it("maps colors, radius and fonts", () => {
    const vars = themeVariables(sanitizeTokens(deTokens), fonts);
    expect(vars["--site-primary"]).toBe("#1F3A5F");
    expect(vars["--site-background"]).toBe("#FAFAF7");
    expect(vars["--site-radius"]).toBe("0.25rem");
    expect(vars["--site-font-heading"]).toBe("var(--h)");
    expect(themeVariables(sanitizeTokens(frTokens), fonts)["--site-radius"]).toBe("1rem");
  });

  it("invalid values fall back to the base default, field by field", () => {
    const t = sanitizeTokens({
      ...deTokens,
      colors: { ...deTokens.colors, primary: "red;}body{display:none", accent: "#12" },
      radius: "huge",
      header_style: "mega",
      product_card_style: 7,
      fonts: { heading: { family: "</style><script>" }, body: deTokens.fonts.body },
    });
    expect(t.colors.primary).toBe(DEFAULT_TOKENS.colors.primary);
    expect(t.colors.accent).toBe(DEFAULT_TOKENS.colors.accent);
    expect(t.colors.secondary).toBe("#E8E1D9");
    expect(t.radius).toBe("md");
    expect(t.header_style).toBe("minimal");
    expect(t.product_card_style).toBe("bordered");
    expect(t.fonts.heading.family).toBe("Inter");
    expect(sanitizeTokens(null)).toEqual(DEFAULT_TOKENS);
  });

  it("CSS output can never close the style element", () => {
    expect(themeCss(sanitizeTokens(deTokens), { heading: "x</style>", body: "y" })).not.toContain("</style>");
  });
});

describe("variants", () => {
  it("header_style → component", () => {
    expect(HEADER_VARIANTS.minimal).toBe(MinimalHeader);
    expect(HEADER_VARIANTS.centered).toBe(CenteredHeader);
    expect(HEADER_VARIANTS.split).toBe(SplitHeader);
  });

  it("product_card_style → classes", () => {
    expect(CARD_STYLES.bordered.card).toContain("border");
    expect(CARD_STYLES.elevated.card).toContain("shadow");
    expect(CARD_STYLES.plain.card).toBe("");
  });

  it("design registry merges overrides over base", () => {
    const a = getDesign("design-a");
    expect(a.blocks.hero).toBe(HeroA);
    expect(a.blocks.features).toBe(base.blocks.features);
    expect(a.Header).toBe(base.Header);
    const b = getDesign("design-b");
    expect(b.blocks.features).toBe(FeaturesB);
    expect(getDesign("does-not-exist").id).toBe("base");
    const Custom = () => null;
    expect(mergeDesign("x", { ProductCard: Custom }).ProductCard).toBe(Custom);
  });

  it("site key → design id, default base", () => {
    expect(designIdForSite("nordic-home-de")).toBe("design-a");
    expect(designIdForSite("nordic-home-fr")).toBe("design-b");
    expect(designIdForSite("nordic-home-at")).toBe("base");
  });
});

describe("fonts", () => {
  const registry = { Fraunces: { className: "f-cls", variable: "--ff-fraunces", fallback: SERIF_STACK } };

  it("registered family → next/font variable + fallback", () => {
    expect(resolveFont({ family: "Fraunces", weights: [500], source: "google" }, registry)).toEqual({
      stack: `var(--ff-fraunces), ${SERIF_STACK}`,
      className: "f-cls",
    });
  });

  it("unknown family → system stack + warning", () => {
    const warn = vi.fn();
    expect(resolveFont({ family: "Comic Neue", weights: [400], source: "google" }, registry, warn)).toEqual({ stack: SANS_STACK, className: null });
    expect(warn).toHaveBeenCalledOnce();
  });

  it("system source → quoted family + system stack", () => {
    expect(resolveFont({ family: "Helvetica Neue", weights: [], source: "system" }, registry).stack).toBe(`"Helvetica Neue", ${SANS_STACK}`);
  });
});

describe("contrast", () => {
  it("computes WCAG ratios", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 1);
  });

  it.each([
    ["nordic-home-de", deTokens],
    ["nordic-home-fr", frTokens],
  ])("seeded theme %s passes AA", (_k, tokens) => {
    expect(checkContrast(tokens.colors)).toEqual([]);
  });

  it("flags low-contrast pairs", () => {
    expect(checkContrast({ ...deTokens.colors, muted: "#CCCCCC" }).map((i) => i.pair)).toEqual(["muted/background"]);
  });
});
