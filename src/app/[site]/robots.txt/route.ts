/** Primary host in production: crawlable + sitemap. Every other host or env: Disallow all. */
import { getEnv } from "@/config/env";
import { isIndexableHost, robotsTxt } from "@/lib/seo/robots";
import { hostMapCache } from "@/lib/site/hosts";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ site: string }> }) {
  const { site: siteKey } = await params;
  const site = (await hostMapCache().get()).byKey.get(siteKey);
  if (!site) return new Response("Not found", { status: 404 });
  const indexable = isIndexableHost({
    isProduction: getEnv().isProduction,
    host: req.headers.get("x-site-host"),
    primaryHost: site.primaryHost,
  });
  return new Response(robotsTxt({ indexable, primaryHost: site.primaryHost }), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
