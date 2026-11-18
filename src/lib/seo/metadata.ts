/** Backend `Seo` → Next `Metadata`. */
import type { Metadata } from "next";
import type { Seo, SiteConfig } from "@/types/api";

export const NOINDEX = "noindex, nofollow";

export function seoToMetadata(seo: Seo, { indexable }: { indexable: boolean }): Metadata {
  const image = seo.og.image ? [{ url: seo.og.image }] : undefined;
  return {
    // The backend title is already "X | Site": don't let a template append to it.
    title: { absolute: seo.title },
    description: seo.description ?? undefined,
    alternates: {
      canonical: seo.canonical,
      languages: seo.alternates.length
        ? Object.fromEntries(seo.alternates.map((a) => [a.hreflang, a.href]))
        : undefined,
    },
    openGraph: {
      title: seo.og.title,
      description: seo.og.description ?? undefined,
      url: seo.og.url,
      siteName: seo.og.site_name,
      locale: seo.og.locale,
      type: "website",
      images: image,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: seo.og.title, images: image },
    robots: indexable ? seo.robots : NOINDEX,
  };
}

/** Site-wide metadata from the layout: base URL for relative URLs, favicon, app name. */
export function siteMetadata(config: SiteConfig, { indexable }: { indexable: boolean }): Metadata {
  const favicon = config.theme?.favicon?.url;
  return {
    metadataBase: config.site.base_url ? new URL(config.site.base_url) : undefined,
    applicationName: config.site.name,
    icons: favicon ? { icon: favicon } : undefined,
    robots: indexable ? undefined : NOINDEX,
  };
}

/** Optional Organization JSON-LD for the home page. */
export function organizationJsonLd(config: SiteConfig): Record<string, unknown> | null {
  if (!config.site.base_url) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.site.name,
    url: `${config.site.base_url}/`,
    ...(config.theme?.logo ? { logo: config.theme.logo.url } : {}),
  };
}
