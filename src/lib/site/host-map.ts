/**
 * Host → site map, built from `GET /public/v1/sites` and kept in memory.
 *
 * - Fresh for HOST_MAP_TTL_SECONDS (the backend sends s-maxage=60).
 * - Stale: keep serving the old map and refresh in the background.
 * - Refresh fails: keep the last good map, log, retry after a short backoff.
 * - No map at all (cold start + backend down): `HostMapUnavailable` → 503 in the proxy.
 *
 * The cache lives on `globalThis` so the proxy and route handlers in the same process share
 * it (the revalidate webhook calls `invalidate()` on a `sites` tag). If they ever run in
 * separate isolates, the TTL still bounds staleness.
 */
import type { SiteList, SiteRef } from "@/types/api";
import { looseHost, normalizeHost } from "./hostnames";

export interface HostEntry {
  site: SiteRef;
  hostname: string;
  isPrimary: boolean;
  redirectToPrimary: boolean;
}

export interface HostMap {
  byHost: ReadonlyMap<string, HostEntry>;
  byKey: ReadonlyMap<string, SiteRef>;
}

export class HostMapUnavailable extends Error {
  override name = "HostMapUnavailable";
}

export function buildHostMap(list: SiteList): HostMap {
  const byHost = new Map<string, HostEntry>();
  const byKey = new Map<string, SiteRef>();
  for (const item of list.sites) {
    const site: SiteRef = {
      id: item.id,
      key: item.key,
      name: item.name,
      defaultLocale: item.default_locale,
      locales: [...item.locales],
      primaryHost: item.primary_host ?? null,
    };
    byKey.set(site.key, site);
    for (const host of item.hosts) {
      const hostname = normalizeHost(host.hostname);
      if (!hostname) continue;
      byHost.set(hostname, {
        site,
        hostname,
        isPrimary: host.is_primary,
        redirectToPrimary: host.redirect_to_primary,
      });
    }
  }
  return { byHost, byKey };
}

/**
 * Exact match only, never a default site. Dev aliases (non-production only, already
 * emptied by env parsing in production) are checked after the real map and never redirect.
 */
export function lookupHost(
  map: HostMap,
  rawHost: string | null | undefined,
  devAliases: ReadonlyMap<string, string> = new Map(),
): HostEntry | null {
  const hostname = normalizeHost(rawHost);
  if (hostname) {
    const hit = map.byHost.get(hostname);
    if (hit) return hit;
  }
  if (devAliases.size) {
    const loose = looseHost(rawHost);
    const key = loose ? devAliases.get(loose) : undefined;
    const site = key ? map.byKey.get(key) : undefined;
    if (site && loose) return { site, hostname: loose, isPrimary: false, redirectToPrimary: false };
  }
  return null;
}

interface Logger {
  warn(message: string, data?: unknown): void;
}

export class HostMapCache {
  private map: HostMap | null = null;
  private fetchedAt = 0;
  private retryAt = 0;
  private forceRefresh = false;
  private inflight: Promise<HostMap> | null = null;

  constructor(
    private readonly load: () => Promise<SiteList>,
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
    private readonly log: Logger = console,
    private readonly retryMs = Math.min(ttlMs, 10_000),
  ) {}

  async get(): Promise<HostMap> {
    const current = this.map;
    if (!current) {
      try {
        return await this.refresh();
      } catch (err) {
        throw new HostMapUnavailable(`Host map unavailable: ${String(err)}`);
      }
    }
    const t = this.now();
    if (this.forceRefresh) {
      this.forceRefresh = false;
      return this.refresh().catch(() => current);
    }
    if (t - this.fetchedAt >= this.ttlMs && t >= this.retryAt) {
      void this.refresh().catch(() => undefined); // stale-while-revalidate
    }
    return current;
  }

  /** Domain changes (`sites` tag): the next lookup waits for a fresh map. */
  invalidate(): void {
    this.forceRefresh = true;
  }

  private refresh(): Promise<HostMap> {
    this.inflight ??= this.load()
      .then((list) => {
        this.map = buildHostMap(list);
        this.fetchedAt = this.now();
        return this.map;
      })
      .catch((err: unknown) => {
        this.retryAt = this.now() + this.retryMs;
        this.log.warn("[host-map] refresh failed; serving last good map", {
          error: String(err),
          hasMap: this.map !== null,
        });
        throw err;
      })
      .finally(() => {
        this.inflight = null;
      });
    return this.inflight;
  }
}

const GLOBAL_KEY = Symbol.for("showcase.hostMapCache");
type GlobalWithCache = typeof globalThis & { [GLOBAL_KEY]?: HostMapCache };

/** Process-wide singleton. `factory` is only used the first time. */
export function sharedHostMapCache(factory: () => HostMapCache): HostMapCache {
  const g = globalThis as GlobalWithCache;
  g[GLOBAL_KEY] ??= factory();
  return g[GLOBAL_KEY];
}
