/**
 * The site's branded 404, fully server-rendered (works without JS). The proxy rewrites
 * every unknown path here with status 404, so it is one static page per site/locale and
 * random URLs never fill the ISR cache.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/common/Container";
import { buttonClass } from "@/components/common/styles";
import { SiteShell } from "@/components/layouts/SiteShell";
import { NOINDEX } from "@/lib/seo/metadata";
import { getSite } from "@/lib/site/context";
import { shellProps } from "@/lib/site/view";

type Params = Promise<{ site: string; locale: string }>;

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { site, locale } = await params;
  const ctx = await getSite(site, locale);
  return { title: { absolute: `${ctx.messages.notFoundTitle} | ${ctx.config.site.name}` }, robots: NOINDEX };
}

export default async function MissingPage({ params }: { params: Params }) {
  const { site: siteKey, locale } = await params;
  const site = await getSite(siteKey, locale);
  const { header, footer } = shellProps(site, null);
  return (
    <SiteShell design={site.design} header={header} footer={footer}>
      <Container className="flex max-w-2xl flex-col items-start gap-6 py-24">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">{site.messages.notFoundTitle}</h1>
        <p className="text-lg text-muted">{site.messages.notFoundBody}</p>
        <Link href={header.homeHref} className={buttonClass}>
          {site.messages.backHome}
        </Link>
      </Container>
    </SiteShell>
  );
}
