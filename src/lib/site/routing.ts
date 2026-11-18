/**
 * The public URL scheme. The only frontend copy of backend `modules/public/urls.py`:
 *
 *     default locale   /            /products
 *     other locales    /{locale}    /{locale}/products
 */
import type { PageKind } from "@/types/api";

export interface LocaleSite {
  defaultLocale: string;
  locales: readonly string[];
}

export function localePrefix(site: LocaleSite, locale: string): string {
  return locale === site.defaultLocale ? "" : `/${locale}`;
}

export function homePath(site: LocaleSite, locale: string): string {
  return localePrefix(site, locale) || "/";
}

export function productsPath(site: LocaleSite, locale: string): string {
  return `${localePrefix(site, locale)}/products`;
}

export function pagePath(site: LocaleSite, locale: string, page: PageKind): string {
  return page === "home" ? homePath(site, locale) : productsPath(site, locale);
}

/** `de` on a DE site → `de-DE` (same rule as backend `urls.hreflang`). */
export function htmlLang(locale: string, countryCode: string): string {
  return locale.includes("-") ? locale : `${locale}-${countryCode.toUpperCase()}`;
}

export type ParsedPath =
  | { kind: "ok"; locale: string; rest: string }
  | { kind: "redirect"; pathname: string };

/**
 * Split an incoming site-relative pathname into locale + rest.
 * `/{defaultLocale}/…` redirects to the unprefixed path so each page has one URL.
 */
export function parsePathname(site: LocaleSite, pathname: string): ParsedPath {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const [, first = "", ...more] = path.split("/");
  const tail = more.length ? `/${more.join("/")}` : "";

  if (first === site.defaultLocale) {
    return { kind: "redirect", pathname: tail || "/" };
  }
  if (first && site.locales.includes(first)) {
    return { kind: "ok", locale: first, rest: tail };
  }
  return { kind: "ok", locale: site.defaultLocale, rest: path === "/" ? "" : path };
}

/**
 * Locale-neutral paths of the pages that exist (`rest` after the locale prefix). Anything
 * else is answered by the proxy with the site's static 404 page (status 404).
 */
export const PAGE_RESTS: Readonly<Record<string, PageKind>> = { "": "home", "/products": "products" };

/** Internal segment of the branded 404 page (`app/[site]/[locale]/(pages)/missing`). */
export const NOT_FOUND_SEGMENT = "/missing";

/** Which known page a site-relative path is, for any of the site's locales. */
export function pageOfPath(site: LocaleSite, pathname: string): { page: PageKind; locale: string } | null {
  for (const locale of site.locales) {
    if (pathname === homePath(site, locale)) return { page: "home", locale };
    if (pathname === productsPath(site, locale)) return { page: "products", locale };
  }
  return null;
}
