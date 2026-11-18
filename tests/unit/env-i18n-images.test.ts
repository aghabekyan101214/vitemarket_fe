import { describe, expect, it } from "vitest";
import { EnvError, parseEnv } from "@/config/env";
import { format, getMessages, languageName, plural } from "@/lib/i18n/t";
import de from "@/lib/i18n/messages/de";
import en from "@/lib/i18n/messages/en";
import fr from "@/lib/i18n/messages/fr";
import { buildImageUrl } from "@/lib/images/loader";
import { mediaUrl } from "@/lib/images/media";

describe("env", () => {
  it("defaults", () => {
    const env = parseEnv({ SHOWCASE_API_URL: "http://localhost:8000/public/v1/" });
    expect(env).toMatchObject({ apiUrl: "http://localhost:8000/public/v1", apiMode: "http", appEnv: "local", isProduction: false, hostMapTtlSeconds: 60, imageProvider: "none", trustForwardedHost: false });
  });

  it("parses dev aliases outside production", () => {
    const env = parseEnv({ SHOWCASE_API_MODE: "mock", DEV_HOST_ALIASES: "localhost=nordic-home-de, Staging-DE.example.dev=nordic-home-de" });
    expect([...env.devHostAliases]).toEqual([["localhost", "nordic-home-de"], ["staging-de.example.dev", "nordic-home-de"]]);
  });

  it.each([
    [{ SHOWCASE_API_MODE: "http" }, /SHOWCASE_API_URL is required/],
    [{ SHOWCASE_API_URL: "not a url" }, /not a valid URL/],
    [{ APP_ENV: "prod", SHOWCASE_API_MODE: "mock" }, /APP_ENV/],
    [{ APP_ENV: "production", SHOWCASE_API_MODE: "mock" }, /not allowed/],
    [{ APP_ENV: "production", SHOWCASE_API_URL: "https://api.x/public/v1", REVALIDATE_WEBHOOK_SECRET: "short" }, /at least 16/],
    [{ SHOWCASE_API_MODE: "mock", HOST_MAP_TTL_SECONDS: "0" }, /positive integer/],
    [{ SHOWCASE_API_MODE: "mock", TRUST_FORWARDED_HOST: "yes" }, /true or false/],
    [{ SHOWCASE_API_MODE: "mock", DEV_HOST_ALIASES: "localhost" }, /host=site-key/],
  ])("fails fast on %o", (source, message) => {
    expect(() => parseEnv(source)).toThrow(EnvError);
    expect(() => parseEnv(source)).toThrow(message);
  });
});

describe("i18n", () => {
  it("dictionaries have the same keys", () => {
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
  });

  it("language fallback pt-BR → pt → en", () => {
    expect(getMessages("de")).toBe(de);
    expect(getMessages("fr-CA")).toBe(fr);
    expect(getMessages("pt-BR")).toBe(en);
  });

  it("plural + number formatting with the de-DE tag", () => {
    expect(plural(de.productCount, 8, "de-DE")).toBe("8 Produkte");
    expect(plural(de.productCount, 1, "de-DE")).toBe("1 Produkt");
    expect(plural(en.productCount, 1200, "en-DE")).toBe("1.200 products"); // English in Germany groups like German
    expect(plural(en.productCount, 1200, "en-GB")).toBe("1,200 products");
    expect(plural(fr.productCount, 0, "fr-FR")).toBe("0 produit"); // French: 0 is singular
  });

  it("format + autonyms", () => {
    expect(format(en.copyright, { year: 2026, site: "Nordic" })).toBe("© 2026 Nordic");
    expect(languageName("de")).toBe("Deutsch");
    expect(languageName("fr")).toBe("Français");
  });
});

describe("images", () => {
  it("cloudflare → /cdn-cgi/image on the media origin", () => {
    expect(buildImageUrl("cloudflare", { src: "https://media.example.com/seed/a.webp", width: 640 })).toBe(
      "https://media.example.com/cdn-cgi/image/width=640,quality=75,format=auto/seed/a.webp",
    );
    expect(buildImageUrl("cloudflare", { src: "/mock-media/a.webp", width: 320, quality: 60 })).toBe("/cdn-cgi/image/width=320,quality=60,format=auto/mock-media/a.webp");
  });

  it("none → raw URL with a width marker", () => {
    expect(buildImageUrl("none", { src: "http://localhost:8333/media/a.webp", width: 960 })).toBe("http://localhost:8333/media/a.webp?w=960");
    expect(buildImageUrl(undefined, { src: "/a.webp?v=1", width: 480 })).toBe("/a.webp?v=1&w=480");
  });

  it("mediaUrl joins base and key", () => {
    expect(mediaUrl("http://localhost:8333/media/", "/seed/x.webp")).toBe("http://localhost:8333/media/seed/x.webp");
    expect(mediaUrl("http://x", null)).toBeNull();
  });
});
