import type { Design } from "@/designs/types";
import type { Messages } from "@/lib/i18n/t";
import { GRID_SIZES } from "@/lib/images/media";
import type { ProductCardStyle, ProductSummary } from "@/types/api";
import { EmptyState } from "./EmptyState";

/** 1 / 2 / 3 / 4 columns. The first `eagerCount` images load eagerly (LCP candidates). */
export function ProductGrid({
  products,
  design,
  variant,
  messages,
  eagerCount = 0,
}: {
  products: ProductSummary[];
  design: Design;
  variant: ProductCardStyle;
  messages: Messages;
  eagerCount?: number;
}) {
  if (!products.length) return <EmptyState message={messages.emptyProducts} />;
  const { ProductCard } = design;
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="product-grid">
      {products.map((product, i) => (
        <li key={product.id}>
          <ProductCard product={product} variant={variant} eager={i < eagerCount} sizes={GRID_SIZES} messages={messages} />
        </li>
      ))}
    </ul>
  );
}
