/**
 * Cache tag builders: the single place that knows the tag format. Mirrors backend
 * `modules/publishing/impact.py` and the table in `docs/frontend-revalidation.md`.
 */
import type { SeoPage, SiteRef } from "@/types/api";

type Site = Pick<SiteRef, "id" | "locales">;

export const SITES_TAG = "sites";
export const siteTag = (siteId: string) => `site:${siteId}`;
export const homeTag = (siteId: string, locale: string) => `site:${siteId}:home:${locale}`;
export const productsTag = (siteId: string, locale: string) => `site:${siteId}:products:${locale}`;
export const productTag = (siteId: string, productId: string) => `site:${siteId}:product:${productId}`;

export const tagsFor = {
  sites: (): string[] => [SITES_TAG],
  config: (site: Site): string[] => [siteTag(site.id)],
  home: (site: Site, locale: string): string[] => [siteTag(site.id), homeTag(site.id, locale)],
  products: (site: Site, locale: string): string[] => [siteTag(site.id), productsTag(site.id, locale)],
  seo: (site: Site, page: SeoPage, locale: string): string[] =>
    page === "home" ? tagsFor.home(site, locale) : tagsFor.products(site, locale),
  /** The sitemap lists home and products pages of every locale. */
  sitemap: (site: Site): string[] => [
    siteTag(site.id),
    ...site.locales.flatMap((l) => [homeTag(site.id, l), productsTag(site.id, l)]),
  ],
};
