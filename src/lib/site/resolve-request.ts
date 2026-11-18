/**
 * The proxy's routing decision as a pure function (unit-tested; `proxy.ts` only applies it).
 *
 * 1. Host → site, exact match only (unknown host → 404, never a default site).
 * 2. Alias with redirect_to_primary → 308 to the primary host, path and query kept.
 * 3. `/sitemap.xml`, `/robots.txt` → per-site route handlers.
 * 4. Locale from the first path segment; `/{defaultLocale}/…` → 308 unprefixed.
 * 5. Known page → rewrite to `/{siteKey}/{locale}{rest}`. Any other path → the site's static
 *    404 page with status 404. The `[site]` segment can never be set from outside:
 *    `/other-site/fr/products` on this host is just an unknown path → 404.
 */
import type { HostEntry, HostMap } from "./host-map";
import { lookupHost } from "./host-map";
import { NOT_FOUND_SEGMENT, PAGE_RESTS, parsePathname } from "./routing";

export type ProxyDecision =
  | { type: "not_found" }
  | { type: "redirect"; location: string; external: boolean }
  | { type: "rewrite"; pathname: string; entry: HostEntry; locale: string | null; status: 200 | 404 };

export interface RequestInfo {
  host: string | null;
  pathname: string;
  search: string;
}

const SITE_FILES = new Set(["/sitemap.xml", "/robots.txt"]);

export function resolveRequest(
  req: RequestInfo,
  map: HostMap,
  devAliases: ReadonlyMap<string, string> = new Map(),
): ProxyDecision {
  const entry = lookupHost(map, req.host, devAliases);
  if (!entry) return { type: "not_found" };

  const { site } = entry;
  if (
    !entry.isPrimary &&
    entry.redirectToPrimary &&
    site.primaryHost &&
    site.primaryHost !== entry.hostname
  ) {
    return {
      type: "redirect",
      location: `https://${site.primaryHost}${req.pathname}${req.search}`,
      external: true,
    };
  }

  if (SITE_FILES.has(req.pathname)) {
    return { type: "rewrite", pathname: `/${site.key}${req.pathname}`, entry, locale: null, status: 200 };
  }

  const parsed = parsePathname(site, req.pathname);
  if (parsed.kind === "redirect") {
    return { type: "redirect", location: `${parsed.pathname}${req.search}`, external: false };
  }
  const known = Object.hasOwn(PAGE_RESTS, parsed.rest);
  return {
    type: "rewrite",
    pathname: `/${site.key}/${parsed.locale}${known ? parsed.rest : NOT_FOUND_SEGMENT}`,
    entry,
    locale: parsed.locale,
    status: known ? 200 : 404,
  };
}
