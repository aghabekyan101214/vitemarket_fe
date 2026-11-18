/**
 * The only interface UI code depends on. `http` talks to the backend, `mock` serves
 * recorded fixtures; switching adapters needs no component changes.
 */
import { getEnv } from "@/config/env";
import type {
  HomePage,
  ProductList,
  ProductSummary,
  Seo,
  SeoPage,
  SiteConfig,
  SiteList,
  SiteRef,
  Sitemap,
} from "@/types/api";
import { createHttpClient } from "./http";
import { createMockClient } from "./mock";

export const MAX_PAGE_SIZE = 100;

export interface ApiClient {
  sites(): Promise<SiteList>;
  config(site: SiteRef, locale: string): Promise<SiteConfig>;
  home(site: SiteRef, locale: string): Promise<HomePage>;
  products(site: SiteRef, locale: string, page: number, pageSize: number): Promise<ProductList>;
  seo(site: SiteRef, page: SeoPage, locale: string): Promise<Seo>;
  sitemap(site: SiteRef): Promise<Sitemap>;
}

let client: ApiClient | undefined;

export function getApiClient(): ApiClient {
  if (!client) {
    const env = getEnv();
    client = env.apiMode === "mock" ? createMockClient() : createHttpClient(env.apiUrl);
  }
  return client;
}

/** Every visible product: loops pages of 100 until `total_pages`. */
export async function allProducts(
  api: ApiClient,
  site: SiteRef,
  locale: string,
): Promise<{ first: ProductList; items: ProductSummary[] }> {
  const first = await api.products(site, locale, 1, MAX_PAGE_SIZE);
  const items = [...first.items];
  for (let page = 2; page <= first.total_pages; page++) {
    items.push(...(await api.products(site, locale, page, MAX_PAGE_SIZE)).items);
  }
  return { first, items };
}
