/**
 * Friendly aliases over the generated OpenAPI types. Never hand-write DTOs:
 * regenerate `api.generated.ts` with `npm run gen:types` after a backend change.
 */
import type { components } from "./api.generated";

type S = components["schemas"];

export type SiteList = S["SiteList"];
export type SiteListItem = S["SiteListItem"];
export type SiteHost = S["SiteHost"];
export type SiteConfig = S["SiteConfig"];
export type SiteInfo = S["SiteInfo"];
export type Theme = S["Theme"];
export type ThemeTokens = S["ThemeTokens"];
export type ThemeColors = S["ThemeColors"];
export type ThemeFont = S["ThemeFont"];
export type Asset = S["Asset"];
export type MediaSettings = S["MediaSettings"];
export type NavItem = S["NavItem"];
export type LocaleLink = S["LocaleLink"];
export type PageContent = S["PageContent"];
export type HomePage = S["HomePage"];
export type ProductList = S["ProductList"];
export type ProductSummary = S["ProductSummary"];
export type ProductImage = S["Image"];
export type Seo = S["Seo"];
export type OpenGraph = S["OpenGraph"];
export type Alternate = S["Alternate"];
export type Sitemap = S["Sitemap"];
export type SitemapEntry = S["SitemapEntry"];
export type Link = S["Link"];

export type HeroBlock = S["HeroBlock"];
export type TextBlock = S["TextBlock"];
export type FeatureListBlock = S["FeatureListBlock"];
export type FeatureItem = S["FeatureItem"];
export type FeaturedProductsBlock = S["FeaturedProductsBlock"];
export type CtaBlock = S["CtaBlock"];
export type ContentBlock = HomePage["blocks"][number];
export type BlockType = ContentBlock["type"];
export type BlockOf<K extends BlockType> = Extract<ContentBlock, { type: K }>;

export type SeoPage = "home" | "products";
export type PageKind = NavItem["page"];

export type HeaderStyle = NonNullable<ThemeTokens["header_style"]>;
export type ProductCardStyle = NonNullable<ThemeTokens["product_card_style"]>;
export type Radius = NonNullable<ThemeTokens["radius"]>;

/** What every API call is addressed by: `key` for URLs, `id` for cache tags. */
export interface SiteRef {
  id: string;
  key: string;
  name: string;
  defaultLocale: string;
  locales: string[];
  primaryHost: string | null;
}
