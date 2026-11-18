/**
 * Optional post-deploy warm-up: requests every primary host × locale × page from `/sites`
 * so the first visitor never waits for an on-demand render.
 *
 *   SHOWCASE_API_URL=https://api.example.com/public/v1 npm run warmup
 *   WARMUP_ORIGIN_TEMPLATE='http://{host}:3000' npm run warmup     # local
 */
const API = (process.env.SHOWCASE_API_URL ?? "http://localhost:8000/public/v1").replace(/\/$/, "");
const TEMPLATE = process.env.WARMUP_ORIGIN_TEMPLATE ?? "https://{host}";

interface SiteItem {
  key: string;
  default_locale: string;
  locales: string[];
  primary_host: string | null;
}

async function main(): Promise<void> {
  const { sites } = (await (await fetch(`${API}/sites`)).json()) as { sites: SiteItem[] };
  const urls: string[] = [];
  for (const site of sites) {
    if (!site.primary_host) continue;
    const origin = TEMPLATE.replace("{host}", site.primary_host);
    for (const locale of site.locales) {
      const prefix = locale === site.default_locale ? "" : `/${locale}`;
      urls.push(`${origin}${prefix || "/"}`, `${origin}${prefix}/products`);
    }
    urls.push(`${origin}/sitemap.xml`);
  }
  let failed = 0;
  for (const url of urls) {
    const res = await fetch(url, { redirect: "manual" }).catch((err: unknown) => ({ status: String(err) }));
    const ok = typeof res.status === "number" && res.status < 400;
    if (!ok) failed++;
    console.log(`${ok ? "ok  " : "FAIL"} ${res.status} ${url}`);
  }
  if (failed) process.exit(1);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
