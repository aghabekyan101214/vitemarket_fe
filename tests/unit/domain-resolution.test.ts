import { describe, expect, it, vi } from "vitest";
import { parseEnv } from "@/config/env";
import { buildHostMap, HostMapCache, HostMapUnavailable, lookupHost } from "@/lib/site/host-map";
import { resolveRequest } from "@/lib/site/resolve-request";
import type { SiteList } from "@/types/api";
import * as fx from "./fixtures";

const list = fx.sites();
// Add a non-redirecting alias to exercise that branch.
const withAlias: SiteList = {
  sites: list.sites.map((s) =>
    s.key === "nordic-home-fr"
      ? { ...s, hosts: [...s.hosts, { hostname: "shop.nordic-home-fr.localhost", is_primary: false, redirect_to_primary: false }] }
      : s,
  ),
};
const map = buildHostMap(withAlias);
const req = (host: string | null, pathname = "/", search = "") => resolveRequest({ host, pathname, search }, map);

describe("host lookup", () => {
  it("exact match only, normalized", () => {
    expect(lookupHost(map, "Nordic-Home-DE.localhost:3000")?.site.key).toBe("nordic-home-de");
    expect(lookupHost(map, "nordic-home-fr.localhost")?.site.key).toBe("nordic-home-fr");
    expect(lookupHost(map, "sub.nordic-home-de.localhost")).toBeNull();
    expect(lookupHost(map, "evil.example.com")).toBeNull();
    expect(lookupHost(map, null)).toBeNull();
  });

  it("dev aliases are checked after the real map and never redirect", () => {
    const aliases = new Map([["localhost", "nordic-home-de"]]);
    expect(lookupHost(map, "localhost:3000", aliases)).toMatchObject({ site: { key: "nordic-home-de" }, isPrimary: false, redirectToPrimary: false });
    expect(lookupHost(map, "nordic-home-fr.localhost", aliases)?.site.key).toBe("nordic-home-fr");
    expect(lookupHost(map, "localhost", new Map([["localhost", "unknown-site"]]))).toBeNull();
  });

  it("dev aliases are ignored in production", () => {
    const env = parseEnv({ APP_ENV: "production", SHOWCASE_API_URL: "https://api.example.com/public/v1", REVALIDATE_WEBHOOK_SECRET: "x".repeat(32), DEV_HOST_ALIASES: "localhost=nordic-home-de" });
    expect(env.devHostAliases.size).toBe(0);
    expect(resolveRequest({ host: "localhost:3000", pathname: "/", search: "" }, map, env.devHostAliases)).toEqual({ type: "not_found" });
  });
});

describe("resolveRequest (proxy)", () => {
  it("unknown host → 404, never a default site", () => {
    expect(req("evil.example.com")).toEqual({ type: "not_found" });
    expect(req("127.0.0.1:3000")).toEqual({ type: "not_found" });
  });

  it("alias with redirect_to_primary → 308 to the primary, path and query kept", () => {
    expect(req("www.nordic-home-de.localhost", "/en/products", "?utm=x")).toEqual({
      type: "redirect",
      location: "https://nordic-home-de.localhost/en/products?utm=x",
      external: true,
    });
  });

  it("alias without redirect serves the site", () => {
    expect(req("shop.nordic-home-fr.localhost", "/products")).toMatchObject({ type: "rewrite", pathname: "/nordic-home-fr/fr/products" });
  });

  it("/{defaultLocale}/… → 308 unprefixed (one URL per page)", () => {
    expect(req("nordic-home-de.localhost", "/de/products", "?a=1")).toEqual({ type: "redirect", location: "/products?a=1", external: false });
    expect(req("nordic-home-de.localhost", "/de")).toEqual({ type: "redirect", location: "/", external: false });
  });

  it("rewrites known pages under /{site}/{locale}", () => {
    expect(req("nordic-home-de.localhost", "/")).toMatchObject({ pathname: "/nordic-home-de/de", locale: "de", status: 200 });
    expect(req("nordic-home-de.localhost", "/products")).toMatchObject({ pathname: "/nordic-home-de/de/products", status: 200 });
    expect(req("nordic-home-de.localhost", "/en/products")).toMatchObject({ pathname: "/nordic-home-de/en/products", locale: "en", status: 200 });
    expect(req("nordic-home-fr.localhost", "/")).toMatchObject({ pathname: "/nordic-home-fr/fr", locale: "fr" });
  });

  it("unknown paths → the site's 404 page with status 404", () => {
    expect(req("nordic-home-de.localhost", "/nope")).toMatchObject({ pathname: "/nordic-home-de/de/missing", status: 404 });
    expect(req("nordic-home-de.localhost", "/en/nope")).toMatchObject({ pathname: "/nordic-home-de/en/missing", status: 404 });
    expect(req("nordic-home-de.localhost", "/products/oak-lounge-chair")).toMatchObject({ status: 404 });
  });

  it("isolation: another site's paths can't be reached", () => {
    expect(req("nordic-home-de.localhost", "/nordic-home-fr/fr/products")).toMatchObject({ pathname: "/nordic-home-de/de/missing", status: 404 });
    // FR has no `en` locale: /en/... is just an unknown path there.
    expect(req("nordic-home-fr.localhost", "/en/products")).toMatchObject({ pathname: "/nordic-home-fr/fr/missing", status: 404 });
  });

  it("sitemap.xml and robots.txt go to the per-site handlers", () => {
    expect(req("nordic-home-de.localhost", "/sitemap.xml")).toMatchObject({ pathname: "/nordic-home-de/sitemap.xml", status: 200 });
    expect(req("nordic-home-fr.localhost", "/robots.txt")).toMatchObject({ pathname: "/nordic-home-fr/robots.txt" });
  });
});

describe("HostMapCache", () => {
  const silent = { warn: vi.fn() };

  it("serves the stale map while refreshing, and keeps it when refresh fails", async () => {
    let now = 0;
    const load = vi.fn<() => Promise<SiteList>>().mockResolvedValueOnce(list).mockRejectedValue(new Error("backend down"));
    const cache = new HostMapCache(load, 60_000, () => now, silent);

    const first = await cache.get();
    expect(first.byKey.has("nordic-home-de")).toBe(true);

    now = 61_000; // stale
    const second = await cache.get();
    expect(second).toBe(first); // served immediately
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    await new Promise((r) => setTimeout(r, 0));
    expect(await cache.get()).toBe(first); // refresh failed → last good map
    expect(silent.warn).toHaveBeenCalled();
  });

  it("cold start with the backend down → HostMapUnavailable", async () => {
    const cache = new HostMapCache(() => Promise.reject(new Error("down")), 60_000, Date.now, silent);
    await expect(cache.get()).rejects.toBeInstanceOf(HostMapUnavailable);
  });

  it("refreshes in the background after the TTL and picks up new domains", async () => {
    let now = 0;
    const updated: SiteList = { sites: [{ ...list.sites[0]!, hosts: [...list.sites[0]!.hosts, { hostname: "new.example.com", is_primary: false, redirect_to_primary: false }] }] };
    const load = vi.fn<() => Promise<SiteList>>().mockResolvedValueOnce(list).mockResolvedValueOnce(updated);
    const cache = new HostMapCache(load, 60_000, () => now, silent);
    await cache.get();
    now = 30_000;
    await cache.get();
    expect(load).toHaveBeenCalledTimes(1); // still fresh
    now = 60_000;
    await cache.get();
    await vi.waitFor(async () => expect((await cache.get()).byHost.has("new.example.com")).toBe(true));
  });

  it("invalidate() makes the next lookup wait for a fresh map", async () => {
    const updated: SiteList = { sites: [] };
    const load = vi.fn<() => Promise<SiteList>>().mockResolvedValueOnce(list).mockResolvedValueOnce(updated);
    const cache = new HostMapCache(load, 60_000, Date.now, silent);
    await cache.get();
    cache.invalidate();
    expect((await cache.get()).byKey.size).toBe(0);
  });
});
