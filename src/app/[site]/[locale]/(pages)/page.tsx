import type { Metadata } from "next";
import { BlockRenderer, hasHero } from "@/components/sections/BlockRenderer";
import { JsonLd } from "@/components/common/JsonLd";
import { SiteShell } from "@/components/layouts/SiteShell";
import { getEnv } from "@/config/env";
import { organizationJsonLd, seoToMetadata } from "@/lib/seo/metadata";
import { getSite } from "@/lib/site/context";
import { loadHome, loadSeo } from "@/lib/site/data";
import { shellProps } from "@/lib/site/view";

type Params = Promise<{ site: string; locale: string }>;

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { site, locale } = await params;
  return seoToMetadata(await loadSeo(site, "home", locale), { indexable: getEnv().isProduction });
}

export default async function HomePage({ params }: { params: Params }) {
  const { site: siteKey, locale } = await params;
  const [site, home, seo] = await Promise.all([
    getSite(siteKey, locale),
    loadHome(siteKey, locale),
    loadSeo(siteKey, "home", locale),
  ]);
  const { header, footer } = shellProps(site, "home");
  const org = organizationJsonLd(site.config);

  return (
    <SiteShell design={site.design} header={header} footer={footer}>
      {/* Exactly one <h1>: the first hero heading, else the page title (visually hidden). */}
      {hasHero(home.blocks) ? null : <h1 className="sr-only">{home.title}</h1>}
      <BlockRenderer
        blocks={home.blocks}
        ctx={{
          mediaBaseUrl: site.config.media.base_url,
          featuredProducts: home.featured_products,
          cardVariant: site.tokens.product_card_style,
          messages: site.messages,
          design: site.design,
        }}
      />
      {seo.json_ld.map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}
      {org ? <JsonLd data={org} /> : null}
    </SiteShell>
  );
}
