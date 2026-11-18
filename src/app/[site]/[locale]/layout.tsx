/**
 * Root layout per site and locale: <html lang> in hreflang form, theme variables, the
 * site's two font families. Rendered on first request, then static until a tag
 * revalidation (generateStaticParams → [] + dynamicParams).
 */
import "../../globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteProvider } from "@/components/common/SiteProvider";
import { SkipLink } from "@/components/common/SkipLink";
import { getEnv } from "@/config/env";
import { siteMetadata } from "@/lib/seo/metadata";
import { getSite } from "@/lib/site/context";

type Params = Promise<{ site: string; locale: string }>;

export const dynamicParams = true;

export function generateStaticParams(): Array<{ site: string; locale: string }> {
  return [];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { site, locale } = await params;
  const ctx = await getSite(site, locale);
  return siteMetadata(ctx.config, { indexable: getEnv().isProduction });
}

export default async function SiteLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { site, locale } = await params;
  const ctx = await getSite(site, locale);
  const homeHref = ctx.config.nav.find((n) => n.page === "home")?.path ?? "/";
  return (
    <html lang={ctx.lang} className={ctx.fontClassNames.join(" ")} data-design={ctx.design.id}>
      <head>
        <style id="site-theme" dangerouslySetInnerHTML={{ __html: ctx.themeCss }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground antialiased">
        <SkipLink label={ctx.messages.skipToContent} />
        <SiteProvider
          value={{ locale, lang: ctx.lang, siteName: ctx.config.site.name, homeHref, messages: ctx.messages }}
        >
          {children}
        </SiteProvider>
      </body>
    </html>
  );
}
