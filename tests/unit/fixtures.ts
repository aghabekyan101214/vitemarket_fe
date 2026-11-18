/** Recorded backend fixtures (same files the mock adapter serves). */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { HomePage, ProductList, Seo, SiteConfig, SiteList, Sitemap } from "@/types/api";

const DIR = path.resolve(__dirname, "../../src/lib/api/fixtures");
const read = <T,>(...p: string[]): T => JSON.parse(readFileSync(path.join(DIR, ...p), "utf8")) as T;

export const sites = () => read<SiteList>("sites.json");
export const config = (site: string, locale: string) => read<SiteConfig>(site, `config.${locale}.json`);
export const home = (site: string, locale: string) => read<HomePage>(site, `home.${locale}.json`);
export const products = (site: string, locale: string) => read<ProductList>(site, `products.${locale}.json`);
export const seo = (site: string, page: string, locale: string) => read<Seo>(site, `seo.${page}.${locale}.json`);
export const sitemap = (site: string) => read<Sitemap>(site, "sitemap.json");
export const FIXTURES_DIR = DIR;
