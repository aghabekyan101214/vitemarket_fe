/**
 * A design = a set of components. `base` implements everything; other designs override
 * only what differs (see `registry.ts`). Components receive plain props, never fetch, and
 * never check the site or country.
 */
import type { ComponentType, ReactNode } from "react";
import type { Messages } from "@/lib/i18n/t";
import type {
  Asset,
  BlockOf,
  BlockType,
  HeaderStyle,
  NavItem,
  PageKind,
  ProductCardStyle,
  ProductSummary,
} from "@/types/api";

export interface LanguageLink {
  locale: string;
  href: string;
  label: string;
  /** hreflang form, e.g. `en-DE`. */
  lang: string;
  current: boolean;
}

export interface HeaderProps {
  variant: HeaderStyle;
  siteName: string;
  logo: Asset | null;
  homeHref: string;
  nav: NavItem[];
  current: PageKind | null;
  languages: LanguageLink[];
  messages: Messages;
}

export interface FooterProps {
  siteName: string;
  nav: NavItem[];
  year: number;
  messages: Messages;
}

export interface ProductCardProps {
  product: ProductSummary;
  variant: ProductCardStyle;
  eager: boolean;
  sizes: string;
  messages: Messages;
}

export interface BlockContext {
  /** Whether this hero carries the page's single <h1>. */
  heroIsH1: boolean;
  mediaBaseUrl: string;
  featuredProducts: ProductSummary[];
  cardVariant: ProductCardStyle;
  messages: Messages;
  design: Design;
}

export interface BlockProps<K extends BlockType> {
  block: BlockOf<K>;
  ctx: BlockContext;
}

export type BlockComponents = { [K in BlockType]: ComponentType<BlockProps<K>> };

export interface Design {
  id: string;
  Header: ComponentType<HeaderProps>;
  Footer: ComponentType<FooterProps>;
  ProductCard: ComponentType<ProductCardProps>;
  blocks: BlockComponents;
}

export type DesignModule = Partial<Omit<Design, "id" | "blocks">> & {
  blocks?: Partial<BlockComponents>;
};

export interface ChildrenProps {
  children?: ReactNode;
}
