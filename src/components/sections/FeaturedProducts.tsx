import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { ProductGrid } from "@/components/products/ProductGrid";
import type { BlockProps } from "@/designs/types";

/** `home.featured_products` (already limited by the API). Omitted when none are featured. */
export function FeaturedProducts({ block, ctx }: BlockProps<"featured_products">) {
  const products = ctx.featuredProducts.slice(0, block.limit ?? 8);
  if (!products.length) return null;
  return (
    <section className="py-16">
      <Container>
        <SectionHeading className="mb-8">{block.heading ?? ctx.messages.featuredFallbackHeading}</SectionHeading>
        <ProductGrid products={products} design={ctx.design} variant={ctx.cardVariant} messages={ctx.messages} />
      </Container>
    </section>
  );
}
