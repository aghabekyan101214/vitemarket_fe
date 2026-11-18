/**
 * Typed, validated server environment. Fails fast (called from `instrumentation.ts` at
 * server start), like the backend's pydantic-settings.
 *
 * Deliberately no `server-only` import: the proxy imports this module too, and it is not
 * compiled with the `react-server` condition. Nothing here is a `NEXT_PUBLIC_` value except
 * the image provider, so it never reaches a client bundle anyway.
 */

export type AppEnv = "local" | "staging" | "production";
export type ApiMode = "http" | "mock";
export type ImageProvider = "none" | "cloudflare";

export interface Env {
  apiUrl: string;
  apiMode: ApiMode;
  webhookSecret: string;
  appEnv: AppEnv;
  isProduction: boolean;
  /** hostname → site key, honored only outside production. */
  devHostAliases: Map<string, string>;
  trustForwardedHost: boolean;
  hostMapTtlSeconds: number;
  imageProvider: ImageProvider;
}

export class EnvError extends Error {
  override name = "EnvError";
}

type Source = Record<string, string | undefined>;

function oneOf<T extends string>(source: Source, name: string, allowed: readonly T[], fallback: T): T {
  const raw = source[name]?.trim();
  if (!raw) return fallback;
  if (!(allowed as readonly string[]).includes(raw)) {
    throw new EnvError(`${name} must be one of ${allowed.join(" | ")}, got ${JSON.stringify(raw)}`);
  }
  return raw as T;
}

function bool(source: Source, name: string): boolean {
  const raw = source[name]?.trim().toLowerCase();
  if (!raw) return false;
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  throw new EnvError(`${name} must be true or false, got ${JSON.stringify(raw)}`);
}

export function parseHostAliases(raw: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const pair of (raw ?? "").split(",")) {
    const item = pair.trim();
    if (!item) continue;
    const [host, key, ...rest] = item.split("=").map((s) => s.trim());
    if (!host || !key || rest.length) {
      throw new EnvError(`DEV_HOST_ALIASES entries must be host=site-key, got ${JSON.stringify(item)}`);
    }
    map.set(host.toLowerCase(), key);
  }
  return map;
}

export function parseEnv(source: Source): Env {
  const appEnv = oneOf(source, "APP_ENV", ["local", "staging", "production"] as const, "local");
  const isProduction = appEnv === "production";
  const apiMode = oneOf(source, "SHOWCASE_API_MODE", ["http", "mock"] as const, "http");
  if (isProduction && apiMode === "mock") {
    throw new EnvError("SHOWCASE_API_MODE=mock is not allowed when APP_ENV=production");
  }

  const apiUrl = (source.SHOWCASE_API_URL ?? "").trim().replace(/\/+$/, "");
  if (apiMode === "http") {
    if (!apiUrl) throw new EnvError("SHOWCASE_API_URL is required when SHOWCASE_API_MODE=http");
    try {
      new URL(apiUrl);
    } catch {
      throw new EnvError(`SHOWCASE_API_URL is not a valid URL: ${JSON.stringify(apiUrl)}`);
    }
  }

  const webhookSecret = (source.REVALIDATE_WEBHOOK_SECRET ?? "").trim();
  if (isProduction && webhookSecret.length < 16) {
    throw new EnvError("REVALIDATE_WEBHOOK_SECRET must be at least 16 characters in production");
  }

  const ttlRaw = source.HOST_MAP_TTL_SECONDS?.trim() || "60";
  const hostMapTtlSeconds = Number(ttlRaw);
  if (!Number.isInteger(hostMapTtlSeconds) || hostMapTtlSeconds < 1) {
    throw new EnvError(`HOST_MAP_TTL_SECONDS must be a positive integer, got ${JSON.stringify(ttlRaw)}`);
  }

  return {
    apiUrl,
    apiMode,
    webhookSecret,
    appEnv,
    isProduction,
    devHostAliases: isProduction ? new Map() : parseHostAliases(source.DEV_HOST_ALIASES),
    trustForwardedHost: bool(source, "TRUST_FORWARDED_HOST"),
    hostMapTtlSeconds,
    imageProvider: oneOf(source, "NEXT_PUBLIC_IMAGE_PROVIDER", ["none", "cloudflare"] as const, "none"),
  };
}

let cached: Env | undefined;

export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
