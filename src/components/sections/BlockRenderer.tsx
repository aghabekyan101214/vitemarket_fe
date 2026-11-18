import type { ComponentType } from "react";
import type { BlockContext, BlockProps } from "@/designs/types";
import type { BlockType, ContentBlock } from "@/types/api";

/**
 * Renders backend blocks in backend order with the design's components. The first hero
 * carries the page's <h1> (when `allowH1`). Unknown block types are skipped and logged, so
 * new backend block types never break existing pages.
 */
export function BlockRenderer({
  blocks,
  ctx,
  allowH1 = true,
}: {
  blocks: ContentBlock[];
  ctx: Omit<BlockContext, "heroIsH1">;
  allowH1?: boolean;
}) {
  const firstHero = allowH1 ? blocks.findIndex((b) => b.type === "hero") : -1;
  return (
    <>
      {blocks.map((block, i) => {
        const Component = ctx.design.blocks[block.type as BlockType] as ComponentType<BlockProps<BlockType>> | undefined;
        if (!Component) {
          console.warn("[blocks] skipping unknown block type", { type: (block as { type?: unknown }).type });
          return null;
        }
        return <Component key={i} block={block as never} ctx={{ ...ctx, heroIsH1: i === firstHero }} />;
      })}
    </>
  );
}

export function hasHero(blocks: ContentBlock[]): boolean {
  return blocks.some((b) => b.type === "hero");
}
