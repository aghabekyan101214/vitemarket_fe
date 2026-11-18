import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { DE, FR, PORT, WWW_DE } from "./helpers";

const cssVar = (page: Page, name: string) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test.describe("DE site (de + en, design A)", () => {
  test("home: lang, h1, theme, canonical, hreflang, JSON-LD", async ({ page }) => {
    const res = await page.goto(`${DE}/`);
    expect(res?.status()).toBe(200);
    expect(res?.headers()["x-robots-tag"]).toBe("noindex, nofollow"); // non-production
    await expect(page.locator("html")).toHaveAttribute("lang", "de-DE");
    await expect(page.locator("html")).toHaveAttribute("data-design", "design-a");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Zeitlos wohnen");
    expect(await cssVar(page, "--site-primary")).toBe("#1F3A5F");
    await expect(page).toHaveTitle("Nordic Home Deutschland | Skandinavisches Design für Ihr Zuhause");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/nordic-home-de\.localhost\/?$/);
    const hreflangs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) => els.map((e) => e.getAttribute("hreflang")));
    expect(hreflangs.sort()).toEqual(["de-DE", "en-DE", "x-default"]);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.map((s) => JSON.parse(s)["@type"])).toEqual(expect.arrayContaining(["WebSite", "Organization"]));
  });

  test("products: all visible products, nothing from FR", async ({ page }) => {
    await page.goto(`${DE}/products`);
    await expect(page.locator("h1")).toHaveText("Produkte");
    await expect(page.getByTestId("product-count")).toHaveText("8 Produkte");
    const skus = await page.locator("article[data-sku]").evaluateAll((els) => els.map((e) => e.getAttribute("data-sku")));
    expect(skus).toHaveLength(8);
    expect(skus).toContain("NH-CHAIR-OAK");
    expect(skus).not.toContain("NH-MIRROR-BRASS"); // FR-only
    expect(skus).not.toContain("NH-VASE-CERAMIC");
    await expect(page.locator("article a")).toHaveCount(0); // no detail pages
  });

  test("language switcher links to the same page in English", async ({ page }) => {
    await page.goto(`${DE}/products`);
    const en = page.locator('a[hreflang="en-DE"]').first();
    await expect(en).toHaveAttribute("href", "/en/products");
    await en.click();
    await expect(page).toHaveURL(`${DE}/en/products`);
    await expect(page.locator("html")).toHaveAttribute("lang", "en-DE");
    await expect(page.locator("h1")).toHaveText("Products");
    await expect(page.getByRole("link", { name: "Products" }).first()).toHaveAttribute("aria-current", "page");
  });

  test("default-locale prefix redirects; alias redirects to primary", async ({ request }) => {
    const prefixed = await request.get(`${DE}/de/products?x=1`, { maxRedirects: 0 });
    expect(prefixed.status()).toBe(308);
    // Next turns same-origin redirects into a relative Location: the visitor stays on this host.
    expect(new URL(prefixed.headers().location!, DE).toString()).toBe(`${DE}/products?x=1`);
    const alias = await request.get(`${WWW_DE}/en/products?x=1`, { maxRedirects: 0 });
    expect(alias.status()).toBe(308);
    expect(alias.headers().location).toBe("https://nordic-home-de.localhost/en/products?x=1");
  });

  test("sitemap.xml lists home + products in both locales only", async ({ request }) => {
    const res = await request.get(`${DE}/sitemap.xml`);
    expect(res.headers()["content-type"]).toContain("application/xml");
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
    expect(locs).toEqual([
      "https://nordic-home-de.localhost/",
      "https://nordic-home-de.localhost/en",
      "https://nordic-home-de.localhost/en/products",
      "https://nordic-home-de.localhost/products",
    ]);
    expect(xml).toContain('hreflang="x-default"');
  });

  test("robots.txt disallows outside production", async ({ request }) => {
    expect(await (await request.get(`${DE}/robots.txt`)).text()).toBe("User-agent: *\nDisallow: /\n");
  });

  test("unknown path → branded 404; another site's path is not reachable", async ({ page }) => {
    for (const path of ["/nope", "/nordic-home-fr/fr/products", "/products/oak-lounge-chair"]) {
      const res = await page.goto(`${DE}${path}`);
      expect(res?.status(), path).toBe(404);
      await expect(page.locator("h1")).toHaveText("Seite nicht gefunden");
      expect(await cssVar(page, "--site-primary")).toBe("#1F3A5F");
    }
  });
});

test.describe("FR site (fr only, design B)", () => {
  test("home: lang, theme, no hreflang, no language switcher", async ({ page }) => {
    await page.goto(`${FR}/`);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr-FR");
    await expect(page.locator("html")).toHaveAttribute("data-design", "design-b");
    await expect(page.locator("h1")).toHaveText("Un intérieur intemporel");
    expect(await cssVar(page, "--site-primary")).toBe("#2F4F3E");
    expect(await cssVar(page, "--site-radius")).toBe("1rem");
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Langue" })).toHaveCount(0);
  });

  test("products: FR selection, invisible product hidden, nothing DE-only", async ({ page }) => {
    await page.goto(`${FR}/products`);
    const skus = await page.locator("article[data-sku]").evaluateAll((els) => els.map((e) => e.getAttribute("data-sku")));
    expect(skus).toHaveLength(7);
    expect(skus).toContain("NH-MIRROR-BRASS");
    expect(skus).not.toContain("NH-CHAIR-OAK"); // DE-only
    expect(skus).not.toContain("NH-VASE-CERAMIC"); // not visible
    await expect(page.getByTestId("product-count")).toHaveText("7 produits");
  });

  test("/en is not a locale on FR → 404", async ({ request }) => {
    expect((await request.get(`${FR}/en/products`)).status()).toBe(404);
  });
});

test("unknown host → plain 404, never a default site", async ({ request }) => {
  const res = await request.get(`http://unknown-shop.localhost:${PORT}/`);
  expect(res.status()).toBe(404);
  expect(await res.text()).toBe("Not found");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const [name, url, h1] of [
    ["DE home", `${DE}/`, "Zeitlos wohnen"],
    ["DE products", `${DE}/products`, "Produkte"],
    ["FR home", `${FR}/`, "Un intérieur intemporel"],
    ["DE 404", `${DE}/nope`, "Seite nicht gefunden"],
  ] as const) {
    test(`${name} shows all content`, async ({ page }) => {
      await page.goto(url);
      await expect(page.locator("h1")).toHaveText(h1);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
    });
  }

  test("mobile menu works without JS @mobile", async ({ page }) => {
    await page.goto(`${DE}/`);
    const menu = page.locator("summary", { hasText: "Menü" });
    if (await menu.isVisible()) {
      await menu.click();
      await expect(page.locator("details[open] a", { hasText: "Produkte" })).toBeVisible();
    }
  });
});

test.describe("accessibility (axe)", () => {
  for (const url of [`${DE}/`, `${DE}/products`, `${DE}/en/products`, `${FR}/`, `${FR}/products`, `${DE}/nope`]) {
    test(`no serious violations: ${url.replace(/^http:\/\//, "")} @mobile`, async ({ page }) => {
      await page.goto(url);
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
