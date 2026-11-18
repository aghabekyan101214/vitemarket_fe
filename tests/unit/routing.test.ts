import { describe, expect, it } from "vitest";
import { homePath, htmlLang, localePrefix, pageOfPath, pagePath, parsePathname, productsPath } from "@/lib/site/routing";

const de = { defaultLocale: "de", locales: ["de", "en"] };
const fr = { defaultLocale: "fr", locales: ["fr"] };

describe("URL scheme parity with backend modules/public/urls.py", () => {
  it.each([
    [de, "de", "", "/", "/products"],
    [de, "en", "/en", "/en", "/en/products"],
    [fr, "fr", "", "/", "/products"],
  ])("%o %s", (site, locale, prefix, home, products) => {
    expect(localePrefix(site, locale)).toBe(prefix);
    expect(homePath(site, locale)).toBe(home);
    expect(productsPath(site, locale)).toBe(products);
    expect(pagePath(site, locale, "home")).toBe(home);
    expect(pagePath(site, locale, "products")).toBe(products);
  });

  it("hreflang-form html lang (urls.hreflang)", () => {
    expect(htmlLang("de", "DE")).toBe("de-DE");
    expect(htmlLang("en", "de")).toBe("en-DE");
    expect(htmlLang("pt-BR", "PT")).toBe("pt-BR");
  });
});

describe("parsePathname", () => {
  it.each([
    ["/", { kind: "ok", locale: "de", rest: "" }],
    ["/products", { kind: "ok", locale: "de", rest: "/products" }],
    ["/en", { kind: "ok", locale: "en", rest: "" }],
    ["/en/products", { kind: "ok", locale: "en", rest: "/products" }],
    ["/de", { kind: "redirect", pathname: "/" }],
    ["/de/products", { kind: "redirect", pathname: "/products" }],
    ["/fr/products", { kind: "ok", locale: "de", rest: "/fr/products" }],
    ["/EN/products", { kind: "ok", locale: "de", rest: "/EN/products" }],
  ])("%s", (path, expected) => {
    expect(parsePathname(de, path)).toEqual(expected);
  });

  it("pageOfPath recognizes home and products in every locale", () => {
    expect(pageOfPath(de, "/")).toEqual({ page: "home", locale: "de" });
    expect(pageOfPath(de, "/en/products")).toEqual({ page: "products", locale: "en" });
    expect(pageOfPath(de, "/products/oak-lounge-chair")).toBeNull();
  });
});
