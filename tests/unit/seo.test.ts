import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "@/components/common/JsonLd";
import { NOINDEX, organizationJsonLd, seoToMetadata, siteMetadata } from "@/lib/seo/metadata";
import { isIndexableHost, robotsTxt } from "@/lib/seo/robots";
import { filterSitemap, sitemapXml } from "@/lib/seo/sitemap";
import * as fx from "./fixtures";

const de = { defaultLocale: "de", locales: ["de", "en"] };

describe("Seo → Metadata", () => {
  const seo = fx.seo("nordic-home-de", "home", "de");

  it("maps title, canonical, hreflang, OG and robots", () => {
    const m = seoToMetadata(seo, { indexable: true });
    expect(m.title).toEqual({ absolute: seo.title });
    expect(m.description).toBe(seo.description);
    expect(m.alternates?.canonical).toBe("https://nordic-home-de.localhost/");
    expect(m.alternates?.languages).toEqual({
      "de-DE": "https://nordic-home-de.localhost/",
      "en-DE": "https://nordic-home-de.localhost/en",
      "x-default": "https://nordic-home-de.localhost/",
    });
    expect(m.openGraph).toMatchObject({ locale: "de_DE", siteName: "Nordic Home Deutschland", url: seo.og.url });
    expect(m.robots).toBe("index,follow");
  });

  it("non-production is always noindex", () => {
    expect(seoToMetadata(seo, { indexable: false }).robots).toBe(NOINDEX);
    expect(siteMetadata(fx.config("nordic-home-de", "de"), { indexable: false }).robots).toBe(NOINDEX);
  });

  it("single-locale site has no hreflang alternates", () => {
    expect(seoToMetadata(fx.seo("nordic-home-fr", "home", "fr"), { indexable: true }).alternates?.languages).toBeUndefined();
  });

  it("metadataBase and Organization JSON-LD come from config.site", () => {
    const config = fx.config("nordic-home-de", "de");
    expect(siteMetadata(config, { indexable: true }).metadataBase?.toString()).toBe("https://nordic-home-de.localhost/");
    expect(organizationJsonLd(config)).toMatchObject({ "@type": "Organization", name: "Nordic Home Deutschland" });
  });

  it("JSON-LD escapes <", () => {
    expect(serializeJsonLd({ name: "</script><script>alert(1)</script>" })).not.toContain("<");
  });
});

describe("sitemap", () => {
  const { entries } = fx.sitemap("nordic-home-de");

  it("keeps only home and products paths (no product detail URLs)", () => {
    const kept = filterSitemap(entries, de);
    expect(entries.some((e) => e.path.startsWith("/products/"))).toBe(true);
    expect(kept.map((e) => e.path).sort()).toEqual(["/", "/en", "/en/products", "/products"]);
  });

  it("filters alternates the same way", () => {
    const fake = [{ ...entries[0]!, alternates: [...entries[0]!.alternates, { hreflang: "en-DE", href: "https://nordic-home-de.localhost/en/products/oak" }] }];
    expect(filterSitemap(fake, de)[0]!.alternates).toHaveLength(entries[0]!.alternates.length);
  });

  it("emits xhtml:link alternates and lastmod", () => {
    const xml = sitemapXml(filterSitemap(entries, de));
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="en-DE" href="https://nordic-home-de.localhost/en/products"/>');
    expect(xml).toMatch(/<lastmod>\d{4}-\d\d-\d\dT/);
    expect(xml).not.toContain("/products/");
  });
});

describe("robots.txt", () => {
  it("primary host in production → allow + sitemap", () => {
    const indexable = isIndexableHost({ isProduction: true, host: "nordic-home-de.com", primaryHost: "nordic-home-de.com" });
    expect(robotsTxt({ indexable, primaryHost: "nordic-home-de.com" })).toBe("User-agent: *\nAllow: /\n\nSitemap: https://nordic-home-de.com/sitemap.xml\n");
  });

  it.each([
    [{ isProduction: true, host: "www.nordic-home-de.com", primaryHost: "nordic-home-de.com" }],
    [{ isProduction: false, host: "nordic-home-de.com", primaryHost: "nordic-home-de.com" }],
    [{ isProduction: true, host: null, primaryHost: "nordic-home-de.com" }],
  ])("other hosts and environments disallow everything (%o)", (opts) => {
    expect(robotsTxt({ indexable: isIndexableHost(opts), primaryHost: opts.primaryHost })).toBe("User-agent: *\nDisallow: /\n");
  });
});
