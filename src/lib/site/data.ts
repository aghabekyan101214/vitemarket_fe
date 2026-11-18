/**
 * Page data loaders, deduped per request (generateMetadata + page share one call in both
 * http and mock mode). A backend 404 becomes `notFound()`; anything else is thrown so ISR
 * keeps the last good page.
 */
import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { allProducts, getApiClient } from "@/lib/api/client";
import { isNotFound } from "@/lib/api/errors";
import type { SeoPage } from "@/types/api";
import { getSite } from "./context";

async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    if (isNotFound(err)) notFound();
    throw err;
  }
}

export const loadHome = cache(async (siteKey: string, locale: string) => {
  const site = await getSite(siteKey, locale);
  return orNotFound(getApiClient().home(site.ref, locale));
});

export const loadProducts = cache(async (siteKey: string, locale: string) => {
  const site = await getSite(siteKey, locale);
  return orNotFound(allProducts(getApiClient(), site.ref, locale));
});

export const loadSeo = cache(async (siteKey: string, page: SeoPage, locale: string) => {
  const site = await getSite(siteKey, locale);
  return orNotFound(getApiClient().seo(site.ref, page, locale));
});
