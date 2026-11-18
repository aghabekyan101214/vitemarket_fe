import type { Metadata } from "next";
import { Container } from "@/components/common/Container";
import { JsonLd } from "@/components/common/JsonLd";
import { SiteShell } from "@/components/layouts/SiteShell";
import { ProductGrid } from "@/components/products/ProductGrid";
import { BlockRenderer } from "@/components/sections/BlockRenderer";
import { getEnv } from "@/config/env";
import { plural } from "@/lib/i18n/t";
import { seoToMetadata } from "@/lib/seo/metadata";
import { getSite } from "@/lib/site/context";
import { loadProducts, loadSeo } from "@/lib/site/data";
import { shellProps } from "@/lib/site/view";

type Params = Promise<{ site: string; locale: string }>;

export const revalidate = 86400;

/** First row at the widest breakpoint (4 columns) loads eagerly. */
const EAGER_IMAGES = 4;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { site, locale } = await params;
  return seoToMetadata(await loadSeo(site, "products", locale), { indexable: getEnv().isProduction });
}

export default async function ProductsPage({ params }: { params: Params }) {
  const { site: siteKey, locale } = await params;
  const [site, { first, items }, seo] = await Promise.all([
    getSite(siteKey, locale),
    loadProducts(siteKey, locale),
    loadSeo(siteKey, "products", locale),
  ]);
  const { header, footer } = shellProps(site, "products");
  const content = first.content;
  const title = content?.title ?? site.config.nav.find((n) => n.page === "products")?.label ?? "";

  return (
    <SiteShell design={site.design} header={header} footer={footer}>
      <section className="border-b border-border bg-secondary">
        <Container className="flex flex-col gap-3 py-12 sm:py-16">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{title}</h1>
          {content?.subtitle ? <p className="max-w-prose text-lg text-foreground/80">{content.subtitle}</p> : null}
          <p className="text-sm text-foreground/80" data-testid="product-count">
            {plural(site.messages.productCount, items.length, site.lang)}
          </p>
        </Container>
      </section>
      {content?.blocks.length ? (
        <BlockRenderer
          allowH1={false}
          blocks={content.blocks}
          ctx={{
            mediaBaseUrl: site.config.media.base_url,
            featuredProducts: [],
            cardVariant: site.tokens.product_card_style,
            messages: site.messages,
            design: site.design,
          }}
        />
      ) : null}
      <Container className="py-12">
        <ProductGrid
          products={items}
          design={site.design}
          variant={site.tokens.product_card_style}
          messages={site.messages}
          eagerCount={EAGER_IMAGES}
        />
      </Container>
      {seo.json_ld.map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}
    </SiteShell>
  );
}
