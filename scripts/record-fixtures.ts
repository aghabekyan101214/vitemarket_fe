/**
 * Records mock-mode fixtures from a running, seeded backend.
 *
 *   docker compose up -d && docker compose exec api python -m app.cli seed
 *   npm run fixtures:record            # SHOWCASE_API_URL defaults to http://localhost:8000/public/v1
 *
 * Writes src/lib/api/fixtures/** and downloads every referenced media object into
 * public/mock-media/, rewriting media URLs to that folder so mock mode needs no backend.
 * Uses only erasable TypeScript syntax so Node runs it directly (type stripping).
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const API = (process.env.SHOWCASE_API_URL ?? "http://localhost:8000/public/v1").replace(/\/$/, "");
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "src/lib/api/fixtures");
const MEDIA_OUT = path.join(ROOT, "public/mock-media");
const MOCK_MEDIA_BASE = "/mock-media";

type Json = unknown;

async function get(pathname: string): Promise<Json> {
  const res = await fetch(`${API}${pathname}`);
  if (!res.ok) throw new Error(`GET ${pathname} → ${res.status} ${await res.text()}`);
  return res.json();
}

const mediaBases = new Set<string>();
const mediaUrls = new Set<string>();

function collectMedia(value: Json): void {
  if (typeof value === "string") {
    for (const base of mediaBases) if (value.startsWith(`${base}/`)) mediaUrls.add(value);
  } else if (Array.isArray(value)) {
    value.forEach(collectMedia);
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(collectMedia);
  }
}

function rewriteMedia(text: string): string {
  let out = text;
  for (const base of mediaBases) out = out.split(base).join(MOCK_MEDIA_BASE);
  return out;
}

const pending: Array<{ file: string; data: Json }> = [];
function save(file: string, data: Json): void {
  collectMedia(data);
  pending.push({ file, data });
}

async function main(): Promise<void> {
  const sites = (await get("/sites")) as {
    sites: Array<{ key: string; locales: string[] }>;
  };
  save("sites.json", sites);

  for (const site of sites.sites) {
    const base = `/sites/${site.key}`;
    for (const locale of site.locales) {
      const config = (await get(`${base}/config?locale=${locale}`)) as { media: { base_url: string } };
      mediaBases.add(config.media.base_url);
      save(`${site.key}/config.${locale}.json`, config);
      save(`${site.key}/home.${locale}.json`, await get(`${base}/home?locale=${locale}`));
      save(`${site.key}/products.${locale}.json`, await get(`${base}/products?locale=${locale}&page=1&page_size=100`));
      save(`${site.key}/seo.home.${locale}.json`, await get(`${base}/seo?page=home&locale=${locale}`));
      save(`${site.key}/seo.products.${locale}.json`, await get(`${base}/seo?page=products&locale=${locale}`));
    }
    save(`${site.key}/sitemap.json`, await get(`${base}/sitemap`));
  }

  // Collect again now that every media base is known.
  for (const { data } of pending) collectMedia(data);

  await rm(OUT, { recursive: true, force: true });
  for (const { file, data } of pending) {
    const target = path.join(OUT, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, rewriteMedia(JSON.stringify(data, null, 2)) + "\n");
  }

  await rm(MEDIA_OUT, { recursive: true, force: true });
  for (const url of mediaUrls) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`media ${url} → ${res.status}`);
    const rel = rewriteMedia(url).slice(MOCK_MEDIA_BASE.length + 1);
    const target = path.join(MEDIA_OUT, rel);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
  }

  console.log(`Recorded ${pending.length} fixtures and ${mediaUrls.size} media files from ${API}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
