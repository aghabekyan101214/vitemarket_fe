/** Shell props (header/footer) for a page, derived from the resolved site context. */
import type { FooterProps, HeaderProps, LanguageLink } from "@/designs/types";
import { languageName } from "@/lib/i18n/t";
import type { PageKind } from "@/types/api";
import type { SiteContext } from "./context";
import { homePath, htmlLang, pagePath } from "./routing";

export function languageLinks(site: SiteContext, page: PageKind | null): LanguageLink[] {
  const { config } = site;
  const s = { defaultLocale: config.site.default_locale, locales: config.site.locales };
  return config.site.locales.map((locale) => ({
    locale,
    href: page ? pagePath(s, locale, page) : homePath(s, locale),
    label: languageName(locale),
    lang: htmlLang(locale, config.site.country_code),
    current: locale === site.locale,
  }));
}

export function shellProps(site: SiteContext, page: PageKind | null): { header: HeaderProps; footer: FooterProps } {
  const { config, messages } = site;
  const homeHref = config.nav.find((n) => n.page === "home")?.path ?? "/";
  return {
    header: {
      variant: site.tokens.header_style,
      siteName: config.site.name,
      logo: config.theme?.logo ?? null,
      homeHref,
      nav: config.nav,
      current: page,
      languages: languageLinks(site, page),
      messages,
    },
    footer: { siteName: config.site.name, nav: config.nav, year: new Date().getFullYear(), messages },
  };
}
