/**
 * designId → Design. A design module overrides only what differs; everything else comes
 * from `base`. Adding a design: create `designs/<id>/`, register it here, map the site key
 * in `config/designs.ts` (or set `tokens.design` once the backend has it).
 */
import { base } from "./base";
import { designA } from "./design-a";
import { designB } from "./design-b";
import type { Design, DesignModule } from "./types";

export const DESIGN_MODULES: Readonly<Record<string, DesignModule>> = {
  base: {},
  "design-a": designA,
  "design-b": designB,
};

export function mergeDesign(id: string, overrides: DesignModule, fallback: Design = base): Design {
  return {
    ...fallback,
    ...overrides,
    id,
    blocks: { ...fallback.blocks, ...overrides.blocks },
  };
}

const cache = new Map<string, Design>();

export function getDesign(id: string): Design {
  const known = id in DESIGN_MODULES ? id : "base";
  let design = cache.get(known);
  if (!design) {
    design = mergeDesign(known, DESIGN_MODULES[known] ?? {});
    cache.set(known, design);
  }
  return design;
}
