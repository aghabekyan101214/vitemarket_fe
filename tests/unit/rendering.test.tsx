import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Header } from "@/components/layouts/Header";
import { ProductGrid } from "@/components/products/ProductGrid";
import { BlockRenderer } from "@/components/sections/BlockRenderer";
import { getDesign } from "@/designs/registry";
import type { HeaderProps } from "@/designs/types";
import { getMessages } from "@/lib/i18n/t";
import type { ContentBlock } from "@/types/api";
import * as fx from "./fixtures";

const messages = getMessages("de");
const home = fx.home("nordic-home-de", "de");
const ctx = (designId = "base") => ({
  mediaBaseUrl: "/mock-media",
  featuredProducts: home.featured_products,
  cardVariant: "bordered" as const,
  messages,
  design: getDesign(designId),
});

const allBlocks: ContentBlock[] = [
  { type: "hero", heading: "Hero one", subheading: "Sub", image_key: "seed/hero.webp", cta: { label: "Go", href: "/products" } },
  { type: "text", heading: "Über uns", body: "<p>Seit 1998 <strong>handgefertigt</strong>.</p>" },
  { type: "features", heading: null, items: [{ title: "Massives Holz", description: "Zertifiziert", icon: "leaf" }, { title: "No icon", icon: "unknown-icon" }] },
  { type: "featured_products", heading: "Beliebte Stücke", limit: 2 },
  { type: "cta", heading: "Besuchen Sie uns", body: "Showroom", link: { label: "Extern", href: "https://example.com" } },
  { type: "hero", heading: "Hero two" },
];

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

describe("BlockRenderer", () => {
  it.each(["base", "design-a", "design-b"])("renders every block type in order (%s)", (designId) => {
    const html = renderToStaticMarkup(<BlockRenderer blocks={allBlocks} ctx={ctx(designId)} />);
    const order = ["Hero one", "Über uns", "Massives Holz", "Beliebte Stücke", "Besuchen Sie uns", "Hero two"].map((s) => html.indexOf(s));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain("<strong>handgefertigt</strong>");
    expect(html).toContain('src="/mock-media/seed/hero.webp"');
    expect(html).toContain('alt=""'); // decorative hero image
    expect(html).toContain('href="/products"');
    expect(html).toContain('rel="noopener noreferrer"'); // external CTA
    expect(count(html, /data-sku=/g)).toBe(2); // limit applied
  });

  it("exactly one h1: the first hero; block headings h2, card titles h3", () => {
    const html = renderToStaticMarkup(<BlockRenderer blocks={allBlocks} ctx={ctx()} />);
    expect(count(html, /<h1[ >]/g)).toBe(1);
    expect(html).toMatch(/<h1[^>]*>Hero one<\/h1>/);
    expect(html).toMatch(/<h2[^>]*>Hero two<\/h2>/);
    expect(html).toMatch(/<h2[^>]*>Über uns<\/h2>/);
    expect(html).toMatch(/<h3[^>]*>Massives Holz<\/h3>/);
  });

  it("allowH1=false never emits an h1", () => {
    const html = renderToStaticMarkup(<BlockRenderer blocks={allBlocks} ctx={ctx()} allowH1={false} />);
    expect(count(html, /<h1[ >]/g)).toBe(0);
  });

  it("known icons render as inline SVG, unknown icons render nothing", () => {
    const html = renderToStaticMarkup(<BlockRenderer blocks={[allBlocks[2]!]} ctx={ctx()} />);
    expect(count(html, /<svg/g)).toBe(1);
    expect(html).toContain('class="sr-only">Highlights</h2>'); // fallback heading keeps the outline
  });

  it("skips unknown block types (forward compatible)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const blocks = [{ type: "testimonials", items: [] } as unknown as ContentBlock, allBlocks[1]!];
    const html = renderToStaticMarkup(<BlockRenderer blocks={blocks} ctx={ctx()} />);
    expect(html).toContain("Über uns");
    expect(warn).toHaveBeenCalledWith("[blocks] skipping unknown block type", { type: "testimonials" });
  });

  it("featured_products with none featured is omitted", () => {
    const html = renderToStaticMarkup(<BlockRenderer blocks={[allBlocks[3]!]} ctx={{ ...ctx(), featuredProducts: [] }} />);
    expect(html).toBe("");
  });

  it("renders the recorded home fixture", () => {
    const html = renderToStaticMarkup(<BlockRenderer blocks={home.blocks} ctx={ctx("design-a")} />);
    expect(html).toContain("Zeitlos wohnen");
    for (const p of home.featured_products) expect(html).toContain(p.name);
  });
});

describe("ProductGrid", () => {
  const items = fx.products("nordic-home-de", "de").items;

  it("empty → localized empty state", () => {
    const html = renderToStaticMarkup(<ProductGrid products={[]} design={getDesign("base")} variant="plain" messages={messages} />);
    expect(html).toContain('role="status"');
    expect(html).toContain(messages.emptyProducts);
  });

  it("cards are articles without links; first row eager, rest lazy; alt from the API", () => {
    const html = renderToStaticMarkup(<ProductGrid products={items} design={getDesign("base")} variant="elevated" messages={messages} eagerCount={4} />);
    expect(count(html, /<article/g)).toBe(items.length);
    expect(html).not.toMatch(/<a /);
    expect(count(html, /loading="eager"/g)).toBe(4);
    expect(count(html, /loading="lazy"/g)).toBe(items.length - 4);
    expect(html).toContain(`alt="${items[0]!.image!.alt}"`);
    expect(html).toContain("shadow-md");
  });
});

describe("Header", () => {
  const config = fx.config("nordic-home-de", "en");
  const props: HeaderProps = {
    variant: "split",
    siteName: config.site.name,
    logo: null,
    homeHref: "/en",
    nav: config.nav,
    current: "products",
    languages: [
      { locale: "de", href: "/products", label: "Deutsch", lang: "de-DE", current: false },
      { locale: "en", href: "/en/products", label: "English", lang: "en-DE", current: true },
    ],
    messages: getMessages("en"),
  };

  it("marks the current page and links the language switcher to the same page", () => {
    const html = renderToStaticMarkup(<Header {...props} />);
    expect(html).toMatch(/href="\/en\/products"[^>]*aria-current="page"/);
    expect(html).toMatch(/href="\/products" hrefLang="de-DE" lang="de-DE"/);
    expect(html).toContain("<details");
  });

  it("single-locale sites get no language switcher", () => {
    const html = renderToStaticMarkup(<Header {...props} languages={[props.languages[0]!]} />);
    expect(html).not.toContain('aria-label="Language"');
  });
});
