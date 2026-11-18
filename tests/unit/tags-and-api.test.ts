import { describe, expect, it, vi } from "vitest";
import { allProducts } from "@/lib/api/client";
import { ApiError, NotFoundError } from "@/lib/api/errors";
import { createHttpClient } from "@/lib/api/http";
import { createMockClient } from "@/lib/api/mock";
import { homeTag, productTag, productsTag, SITES_TAG, siteTag, tagsFor } from "@/lib/api/tags";
import type { SiteRef } from "@/types/api";
import * as fx from "./fixtures";

const site: SiteRef = { id: "abc", key: "nordic-home-de", name: "Nordic Home", defaultLocale: "de", locales: ["de", "en"], primaryHost: "nordic-home-de.localhost" };

describe("cache tags (docs/frontend-revalidation.md)", () => {
  it("formats", () => {
    expect(SITES_TAG).toBe("sites");
    expect(siteTag("abc")).toBe("site:abc");
    expect(homeTag("abc", "de")).toBe("site:abc:home:de");
    expect(productsTag("abc", "en")).toBe("site:abc:products:en");
    expect(productTag("abc", "p1")).toBe("site:abc:product:p1");
  });

  it("every site fetch carries site:{id}", () => {
    expect(tagsFor.config(site)).toEqual(["site:abc"]);
    expect(tagsFor.home(site, "de")).toEqual(["site:abc", "site:abc:home:de"]);
    expect(tagsFor.products(site, "en")).toEqual(["site:abc", "site:abc:products:en"]);
    expect(tagsFor.seo(site, "home", "en")).toEqual(["site:abc", "site:abc:home:en"]);
    expect(tagsFor.seo(site, "products", "de")).toEqual(["site:abc", "site:abc:products:de"]);
    expect(tagsFor.sitemap(site)).toEqual(["site:abc", "site:abc:home:de", "site:abc:products:de", "site:abc:home:en", "site:abc:products:en"]);
  });
});

describe("http client", () => {
  it("tags fetches, sets a timeout, and never Data-Caches /sites", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ ok: true }));
    const api = createHttpClient("http://api.test/public/v1", fetchImpl as unknown as typeof fetch);
    await api.home(site, "en");
    await api.sites();
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit & { next: unknown }];
    expect(url).toBe("http://api.test/public/v1/sites/nordic-home-de/home?locale=en");
    expect(init.next).toEqual({ tags: ["site:abc", "site:abc:home:en"], revalidate: 86400 });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const [, sitesInit] = fetchImpl.mock.calls[1] as unknown as [string, RequestInit];
    expect(sitesInit.cache).toBe("no-store");
  });

  it("problem+json → ApiError / NotFoundError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const problem = (status: number, code: string) =>
      new Response(JSON.stringify({ status, code, detail: "nope" }), { status, headers: { "content-type": "application/problem+json" } });
    const api404 = createHttpClient("http://api.test", (async () => problem(404, "locale_not_supported")) as unknown as typeof fetch);
    await expect(api404.config(site, "xx")).rejects.toMatchObject({ name: "NotFoundError", code: "locale_not_supported", status: 404 });
    const api500 = createHttpClient("http://api.test", (async () => problem(500, "internal")) as unknown as typeof fetch);
    const err = await api500.config(site, "de").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).not.toBeInstanceOf(NotFoundError);
  });
});

describe("mock client", () => {
  const api = createMockClient(fx.FIXTURES_DIR);

  it("serves recorded fixtures and paginates", async () => {
    const page = await api.products(site, "de", 2, 3);
    expect(page.items.map((p) => p.sku)).toEqual(fx.products("nordic-home-de", "de").items.slice(3, 6).map((p) => p.sku));
    expect(page.total_pages).toBe(Math.ceil(page.total / 3));
  });

  it("allProducts loops until total_pages", async () => {
    const spy = vi.spyOn(api, "products");
    const { items } = await allProducts({ ...api, products: (s, l, _p, size) => api.products(s, l, _p, Math.min(size, 3)).then((r) => ({ ...r, total_pages: Math.ceil(r.total / 3) })) }, site, "de");
    expect(items).toHaveLength(fx.products("nordic-home-de", "de").total);
    spy.mockRestore();
  });

  it("missing fixture = backend 404", async () => {
    await expect(api.home(site, "fr")).rejects.toBeInstanceOf(NotFoundError);
    await expect(api.home({ ...site, key: "../etc" }, "de")).rejects.toBeInstanceOf(NotFoundError);
  });
});
