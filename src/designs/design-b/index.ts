import type { DesignModule } from "../types";
import { FeaturesSection } from "./FeaturesSection";
import { HeroSection } from "./HeroSection";

/** Design B (Figma B): overrides only. */
export const designB: DesignModule = {
  blocks: { hero: HeroSection, features: FeaturesSection },
};
