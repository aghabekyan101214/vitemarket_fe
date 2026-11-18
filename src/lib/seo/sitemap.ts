/**
 * Sitemap entries → XML. Only home and products paths are kept (there are no product
 * detail routes in v1, so product URLs would be 404s); alternates are filtered the same way.
 */
import type { LocaleSite } from "@/lib/site/routing";
import { pageOfPath } from "@/lib/site/routing";
import type { SitemapEntry } from "@/types/api";

function pathOf(href: string): string | null {
  try {
    return new URL(href).pathname;
  } catch {
    return href.startsWith("/") ? href : null;
  }
}

export function filterSitemap(entries: SitemapEntry[], site: LocaleSite): SitemapEntry[] {
  const known = (path: string | null) => path !== null && pageOfPath(site, path) !== null;
  return entries
    .filter((e) => known(e.path))
    .map((e) => ({ ...e, alternates: e.alternates.filter((a) => known(pathOf(a.href))) }));
}

function xmlEscape(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

export function sitemapXml(entries: SitemapEntry[]): string {
  const urls = entries.map((e) => {
    const lines = [`    <loc>${xmlEscape(e.loc)}</loc>`];
    if (e.lastmod) lines.push(`    <lastmod>${xmlEscape(new Date(e.lastmod).toISOString())}</lastmod>`);
    for (const a of e.alternates) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="${xmlEscape(a.hreflang)}" href="${xmlEscape(a.href)}"/>`);
    }
    return `  <url>\n${lines.join("\n")}\n  </url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
