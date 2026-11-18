/**
 * `getSite(siteKey, locale)`: everything a page of one site/locale needs, resolved once per
 * request (React.cache). Server components can't use context, so pages pass the resolved
 * design and messages one level down as props.
 */
import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { designIdForSite } from "@/config/designs";
import { getEnv } from "@/config/env";
import { FONTS } from "@/config/fonts";
import { getApiClient } from "@/lib/api/client";
import { isNotFound } from "@/lib/api/errors";
import { getMessages, type Messages } from "@/lib/i18n/t";
import { checkContrast } from "@/lib/theme/contrast";
import { sanitizeTokens, themeCss } from "@/lib/theme/css-vars";
import { resolveFont } from "@/lib/theme/fonts";
import { getDesign } from "@/designs/registry";
import type { Design } from "@/designs/types";
import type { SiteConfig, SiteRef, ThemeTokens } from "@/types/api";
import { hostMapCache } from "./hosts";
import { htmlLang } from "./routing";

export interface SiteContext {
  ref: SiteRef;
  locale: string;
  /** `de-DE` style tag for <html lang>, Intl formatting and hreflang. */
  lang: string;
  config: SiteConfig;
  tokens: ThemeTokens;
  themeCss: string;
  fontClassNames: string[];
  design: Design;
  messages: Messages;
}

const warned = new Set<string>();
function warnOnce(key: string, message: string, data?: unknown) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message, data ?? "");
}

export const getSite = cache(async (siteKey: string, locale: string): Promise<SiteContext> => {
  const map = await hostMapCache().get();
  const ref = map.byKey.get(siteKey);
  if (!ref || !ref.locales.includes(locale)) notFound();

  let config: SiteConfig;
  try {
    config = await getApiClient().config(ref, locale);
  } catch (err) {
    if (isNotFound(err)) notFound();
    throw err;
  }

  const env = getEnv();
  if (config.media.transform_provider !== env.imageProvider) {
    warnOnce(
      "media-provider",
      `[images] NEXT_PUBLIC_IMAGE_PROVIDER=${env.imageProvider} but the backend uses ${config.media.transform_provider}`,
    );
  }

  const tokens = sanitizeTokens(config.theme?.tokens);
  if (!env.isProduction) {
    const issues = checkContrast(tokens.colors);
    if (issues.length) warnOnce(`contrast:${siteKey}`, `[theme] ${siteKey}: contrast below WCAG AA`, issues);
  }
  const heading = resolveFont(tokens.fonts.heading, FONTS, (m) => warnOnce(`font:${m}`, m));
  const body = resolveFont(tokens.fonts.body, FONTS, (m) => warnOnce(`font:${m}`, m));

  return {
    ref,
    locale,
    lang: htmlLang(locale, config.site.country_code),
    config,
    tokens,
    themeCss: themeCss(tokens, { heading: heading.stack, body: body.stack }),
    fontClassNames: [...new Set([heading.className, body.className].filter((c): c is string => !!c))],
    design: getDesign(designIdForSite(siteKey)),
    messages: getMessages(locale),
  };
});
