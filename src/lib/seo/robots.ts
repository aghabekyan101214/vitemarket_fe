/**
 * robots.txt: only the primary host in production is crawlable. Aliases, staging and
 * local always disallow everything.
 */
export function isIndexableHost(opts: { isProduction: boolean; host: string | null; primaryHost: string | null }): boolean {
  return opts.isProduction && !!opts.host && !!opts.primaryHost && opts.host === opts.primaryHost;
}

export function robotsTxt({ indexable, primaryHost }: { indexable: boolean; primaryHost: string | null }): string {
  if (!indexable || !primaryHost) return "User-agent: *\nDisallow: /\n";
  return `User-agent: *\nAllow: /\n\nSitemap: https://${primaryHost}/sitemap.xml\n`;
}
