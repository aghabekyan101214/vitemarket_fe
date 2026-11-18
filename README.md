# Showcase frontend

One Next.js 16 (App Router, RSC, TypeScript strict, Tailwind v4) codebase serving every
showcase site. The incoming host picks the site; content, theme, SEO and products come from
the backend's `/public/v1` API. Implements [`../FRONTEND_PLAN.md`](../FRONTEND_PLAN.md).

**A new site that reuses an existing design needs no frontend change and no redeploy.**

## Quick start

Requirements: Node 24+.

```bash
cd frontend
npm install
cp .env.example .env.local          # mock mode by default: no backend needed
npm run dev
open http://nordic-home-de.localhost:3000    # DE site (de + en)
open http://nordic-home-fr.localhost:3000    # FR site (fr)
```

`*.localhost` resolves to 127.0.0.1 in browsers, so each seeded site runs on its real local
hostname. `DEV_HOST_ALIASES=localhost=nordic-home-de` also maps plain `localhost`.

### Against the real backend

```bash
# repo root
docker compose up -d && docker compose exec api python -m app.cli seed
# frontend/.env.local
SHOWCASE_API_MODE=http
SHOWCASE_API_URL=http://localhost:8000/public/v1
```

To receive the backend's revalidation webhooks locally, point the backend at this app instead
of `webhook-sink`: set `REVALIDATE_WEBHOOK_URL: http://host.docker.internal:3000/api/revalidate`
in `docker-compose.yml` (`x-backend-env`) and restart `worker`.

## Commands

| Command | What |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` · `lint` · `test` | TypeScript, ESLint, Vitest (unit + component) |
| `npm run test:e2e` | Playwright: builds, starts in mock mode on :3200, tests both sites (desktop + mobile, no-JS, axe) |
| `npm run gen:types` | Re-export `openapi.json` from `../backend` (needs `uv`, no DB) and regenerate `src/types/api.generated.ts` |
| `npm run check:types` | Same + fail if the committed spec/types drifted (CI) |
| `npm run fixtures:record` | Re-record mock fixtures + media from a running, seeded backend |
| `npm run warmup` | Request every primary host × locale × page after a deploy (`WARMUP_ORIGIN_TEMPLATE='http://{host}:3000'` locally) |

CI: [`.github/workflows/frontend.yml`](../.github/workflows/frontend.yml) (types, lint, unit,
OpenAPI drift, build, e2e, Lighthouse CI mobile ≥ 90).

## Environment

Validated at server start by `src/config/env.ts` (fail fast).

| Var | Scope | Example |
| --- | --- | --- |
| `SHOWCASE_API_URL` | server | `http://localhost:8000/public/v1` |
| `SHOWCASE_API_MODE` | server | `http` \| `mock` (mock is refused in production) |
| `REVALIDATE_WEBHOOK_SECRET` | server | shared with the backend; ≥ 16 chars in production |
| `APP_ENV` | server | `local` \| `staging` \| `production`. Non-production is always `noindex` |
| `DEV_HOST_ALIASES` | server, non-prod | `localhost=nordic-home-de,staging-de.example.dev=nordic-home-de` |
| `TRUST_FORWARDED_HOST` | server | `false`. Set `true` only behind a proxy you control |
| `HOST_MAP_TTL_SECONDS` | server | `60` |
| `NEXT_PUBLIC_IMAGE_PROVIDER` | public (build time) | `none` \| `cloudflare`, must match the backend's `IMAGE_TRANSFORM_PROVIDER` |

## How it works

```
request ─▶ src/proxy.ts ──▶ /{siteKey}/{locale}{rest}  ─▶ app/[site]/[locale]/(pages)/…
             │  host map (GET /sites, 60 s TTL, stale fallback, 503 if never loaded)
             │  unknown host → 404 · alias → 308 primary · /{default}/… → 308 unprefixed
             └  unknown path → /{siteKey}/{locale}/missing with status 404
```

* **Routing** (`lib/site/resolve-request.ts`, pure and tested): exact host match only, never a
  default site. Only known pages (`""`, `/products`, see `PAGE_RESTS` in `lib/site/routing.ts`)
  are rewritten to their route; anything else, including another site's paths, gets that site's
  static branded 404 page with a real 404 status. `sitemap.xml` / `robots.txt` go to per-site
  route handlers.
* **Rendering**: `app/[site]/[locale]/layout.tsx` is the root layout per site/locale (`<html
  lang="de-DE">`, theme `<style>`, the two font classes). Pages are ISR: `generateStaticParams →
  []`, rendered on first request, then static until a tag revalidation (24 h safety net). No
  client-side data fetching; apart from Next's runtime and `next/link`, the only client code is a
  small context used by the error boundary.
* **Data**: `lib/api/client.ts` is the only interface UI code uses (`http` or `mock` adapter).
  Every fetch is tagged by `lib/api/tags.ts` (mirror of backend `impact.py`). Errors throw so ISR
  keeps the last good page; backend 404 → `notFound()`.
* **Revalidation**: `POST /api/revalidate` verifies the HMAC exactly like
  `docs/frontend-revalidation.md`, then `revalidateTag(tag, "max")`; a `sites` tag also
  invalidates the host map.
* **Theme**: tokens are re-validated (`lib/theme/css-vars.ts`) and written as `--site-*`
  variables; `globals.css` maps them to Tailwind utilities (`bg-primary`, `text-muted`,
  `rounded-site`, `font-heading`). Contrast is checked in dev (`lib/theme/contrast.ts`).
* **Designs**: `header_style` / `product_card_style` tokens pick variants from lookup tables;
  `designs/registry.ts` merges a design's component overrides over `base`; `config/designs.ts`
  maps site keys to designs.

```
src/
  proxy.ts                         host → site → rewrite
  instrumentation.ts               env validation at startup
  app/[site]/[locale]/layout.tsx   root layout per site/locale
  app/[site]/[locale]/(pages)/     page.tsx (home), products/, missing/ (404), error.tsx, not-found.tsx
  app/[site]/{sitemap.xml,robots.txt}/route.ts
  app/api/revalidate/route.ts      signed webhook
  components/{common,layouts,sections,products}/   plain-props components, never fetch
  designs/{base,design-a,design-b}/ + registry.ts
  config/{env,fonts,designs}.ts    the only place that names site keys / font families
  lib/api      client, http, mock, tags, errors, fixtures/
  lib/site     hostnames, host-map, resolve-request, routing, context (getSite), data, view
  lib/seo      metadata, sitemap, robots
  lib/theme    css-vars, contrast, fonts
  lib/i18n     messages/{en,de,fr}.ts, t.ts
  lib/images   loader (next/image loaderFile), media
  types/       api.generated.ts (openapi-typescript), api.ts (aliases)
tests/unit, tests/e2e
```

## Adding a website

1. **Same design as an existing site**: follow the backend runbook
   ([`docs/runbooks/add-website.md`](../docs/runbooks/add-website.md)), then add the domain to the
   frontend hosting. No frontend code, no deploy: the host map picks it up within 60 s (or at once
   via the `sites` tag when the site is enabled). Unmapped site keys use the `base` design.
2. **New font**: add one line to `src/config/fonts.ts` → deploy. Until then the site falls back
   to a system stack and a warning is logged.
3. **New design**: create `src/designs/<id>/` with only the components that differ, register it
   in `designs/registry.ts`, map the site key in `config/designs.ts` → deploy.
4. **New language**: add `src/lib/i18n/messages/<lang>.ts` (typed against `en.ts`) and font
   subsets if the alphabet needs them.

## Deviations from the plan, and why

* **No `loading.tsx`.** Next streams the skeleton on an uncached (first) render and swaps the
  content in with inline JS, so a no-JS visitor or crawler hitting a cold page would see only the
  skeleton. Pages are static after the first render anyway.
* **404s come from the proxy, not a catch-all `notFound()`.** In Next 16.4 `notFound()` returns
  status 404 but an empty HTML shell, with the 404 UI rendered client-side (reproduced in a bare
  Next app). The proxy rewrites unknown paths to `(pages)/missing` with status 404 instead:
  fully server-rendered, branded, one cached page per site/locale. `not-found.tsx` remains only
  as the fallback for backend 404s during rendering.
* **npm instead of pnpm** (pnpm isn't installed here). Commands are the same with `pnpm`.
* **Design A / Design B** are placeholder overrides (hero; design B also features). Replace
  them once the Figma files arrive: same props, new markup.

## Known limitations / open items

* **JS budget**: ≈ 136 kB gz on modern browsers (React + Next router ≈ 125 kB, app ≈ 10 kB),
  above the plan's 100 kB target. That's the App Router floor; Lighthouse warns on it rather than failing.
* **Mock mode attaches no cache tags** (fixtures are read from disk, not fetched). Test
  revalidation in `http` mode.
* **Shared cache**: `revalidateTag` must reach a shared cache (Vercel, OpenNext on Cloudflare,
  or a custom `cacheHandler` for multiple self-hosted instances). Hosting is still open
  (plan §16 #1).
* **Host-map invalidation** on a `sites` webhook uses a process global; if the proxy runs in a
  separate isolate, the 60 s TTL still bounds staleness.
* Lighthouse's SEO category is off in CI because non-production pages are deliberately `noindex`.
* Still needed from the backend / product owner (plan §16): hero `image_alt`, `ThemeTokens.design`,
  legal pages (Impressum/Datenschutz for DE), and whether categories / product detail pages are in scope.
