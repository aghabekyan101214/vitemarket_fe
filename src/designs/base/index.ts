/** Default implementation of every component (= components/*). */
import { Footer } from "@/components/layouts/Footer";
import { Header } from "@/components/layouts/Header";
import { ProductCard } from "@/components/products/ProductCard";
import { CtaSection } from "@/components/sections/CtaSection";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { TextSection } from "@/components/sections/TextSection";
import type { Design } from "../types";

export const base: Design = {
  id: "base",
  Header,
  Footer,
  ProductCard,
  blocks: {
    hero: HeroSection,
    text: TextSection,
    features: FeaturesSection,
    featured_products: FeaturedProducts,
    cta: CtaSection,
  },
};
