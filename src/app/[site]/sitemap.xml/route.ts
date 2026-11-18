/** Per-host sitemap, filtered to home and products pages (no product detail routes in v1). */
import { getApiClient } from "@/lib/api/client";
import { isNotFound } from "@/lib/api/errors";
import { filterSitemap, sitemapXml } from "@/lib/seo/sitemap";
import { hostMapCache } from "@/lib/site/hosts";

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams(): Array<{ site: string }> {
  return [];
}

export async function GET(_req: Request, { params }: { params: Promise<{ site: string }> }) {
  const { site: siteKey } = await params;
  const site = (await hostMapCache().get()).byKey.get(siteKey);
  if (!site) return new Response("Not found", { status: 404 });
  try {
    const { entries } = await getApiClient().sitemap(site);
    return new Response(sitemapXml(filterSitemap(entries, site)), {
      headers: { "content-type": "application/xml; charset=utf-8" },
    });
  } catch (err) {
    if (isNotFound(err)) return new Response("Not found", { status: 404 });
    throw err;
  }
}
