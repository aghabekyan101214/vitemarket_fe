/**
 * Mock adapter: serves JSON recorded from the seeded backend (`npm run fixtures:record`),
 * so fixtures can't drift from the real contract. Missing fixture = backend 404.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ProductList } from "@/types/api";
import type { ApiClient } from "./client";
import { NotFoundError } from "./errors";

export const FIXTURES_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "src/lib/api/fixtures");

const SAFE_SEGMENT = /^[a-z0-9][a-z0-9.-]*$/i;

export function createMockClient(dir: string = FIXTURES_DIR): ApiClient {
  async function load<T>(endpoint: string, ...segments: string[]): Promise<T> {
    if (!segments.every((s) => SAFE_SEGMENT.test(s))) {
      throw new NotFoundError(404, "not_found", "invalid fixture path", endpoint);
    }
    try {
      // Dev/test only: keep the fixtures out of production output tracing.
      return JSON.parse(await readFile(path.join(/*turbopackIgnore: true*/ dir, ...segments), "utf8")) as T;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        throw new NotFoundError(404, "not_found", `no fixture ${segments.join("/")}`, endpoint);
      }
      throw err;
    }
  }

  return {
    sites: () => load("sites", "sites.json"),
    config: (site, locale) => load("config", site.key, `config.${locale}.json`),
    home: (site, locale) => load("home", site.key, `home.${locale}.json`),
    async products(site, locale, page, pageSize) {
      const all = await load<ProductList>("products", site.key, `products.${locale}.json`);
      const start = (page - 1) * pageSize;
      return {
        ...all,
        items: all.items.slice(start, start + pageSize),
        page,
        page_size: pageSize,
        total_pages: Math.ceil(all.total / pageSize),
      };
    },
    seo: (site, page, locale) => load("seo", site.key, `seo.${page}.${locale}.json`),
    sitemap: (site) => load("sitemap", site.key, "sitemap.json"),
  };
}
