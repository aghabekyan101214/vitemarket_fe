/**
 * HTTP adapter. The only code that knows backend URLs.
 *
 * - Every content fetch is tagged (`tags.ts`) and cached in the Next Data Cache for 24 h
 *   (time-based safety net; edits arrive via tag revalidation).
 * - Non-2xx → `ApiError` (404 → `NotFoundError`). Errors are thrown, never rendered, so ISR
 *   keeps serving the last good page instead of caching an error page.
 * - `/sites` is not Data-Cached: the host map keeps it in memory with its own TTL.
 */
import type { ApiClient } from "./client";
import { ApiError, errorFromResponse } from "./errors";
import { tagsFor } from "./tags";

export const REVALIDATE_SECONDS = 86_400;
const TIMEOUT_MS = 8_000;

type Query = Record<string, string | number | undefined>;

function buildUrl(base: string, path: string, query: Query = {}): string {
  const url = new URL(`${base}${path}`);
  for (const [k, v] of Object.entries(query)) if (v !== undefined) url.searchParams.set(k, String(v));
  return url.toString();
}

export function createHttpClient(baseUrl: string, fetchImpl: typeof fetch = fetch): ApiClient {
  async function get<T>(endpoint: string, path: string, query: Query, tags: string[] | null): Promise<T> {
    const url = buildUrl(baseUrl, path, query);
    const init: RequestInit = {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(tags ? { next: { tags, revalidate: REVALIDATE_SECONDS } } : { cache: "no-store" }),
    };
    let res: Response;
    try {
      res = await fetchImpl(url, init);
    } catch (err) {
      throw new ApiError(0, "network_error", String(err), endpoint);
    }
    if (!res.ok) {
      const error = await errorFromResponse(res, endpoint);
      if (error.status !== 404) {
        console.error("[api] request failed", { endpoint, status: error.status, code: error.code, path });
      }
      throw error;
    }
    return (await res.json()) as T;
  }

  const sitePath = (key: string, rest: string) => `/sites/${encodeURIComponent(key)}${rest}`;

  return {
    sites: () => get("sites", "/sites", {}, null),
    config: (site, locale) => get("config", sitePath(site.key, "/config"), { locale }, tagsFor.config(site)),
    home: (site, locale) => get("home", sitePath(site.key, "/home"), { locale }, tagsFor.home(site, locale)),
    products: (site, locale, page, pageSize) =>
      get(
        "products",
        sitePath(site.key, "/products"),
        { locale, page, page_size: pageSize },
        tagsFor.products(site, locale),
      ),
    seo: (site, page, locale) =>
      get("seo", sitePath(site.key, "/seo"), { page, locale }, tagsFor.seo(site, page, locale)),
    sitemap: (site) => get("sitemap", sitePath(site.key, "/sitemap"), {}, tagsFor.sitemap(site)),
  };
}
