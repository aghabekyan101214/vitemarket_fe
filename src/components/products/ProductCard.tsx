import Image from "next/image";
import type { ProductCardProps } from "@/designs/types";
import type { ProductCardStyle } from "@/types/api";

/** `product_card_style` token → classes. One lookup table, no per-site checks. */
export const CARD_STYLES: Record<ProductCardStyle, { card: string; image: string; body: string }> = {
  plain: { card: "", image: "rounded-site", body: "pt-4" },
  bordered: { card: "rounded-site border border-border overflow-hidden", image: "", body: "p-4" },
  elevated: { card: "rounded-site bg-background shadow-md ring-1 ring-black/5 overflow-hidden", image: "", body: "p-5" },
};

/** No link: there are no product detail pages in v1 (FRONTEND_PLAN §1 #3). */
export function ProductCard({ product, variant, eager, sizes, messages }: ProductCardProps) {
  const style = CARD_STYLES[variant] ?? CARD_STYLES.bordered;
  const img = product.image;
  return (
    <article className={`flex h-full flex-col ${style.card}`} data-sku={product.sku}>
      {img ? (
        <Image
          src={img.url}
          alt={img.alt}
          width={img.width}
          height={img.height}
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          className={`aspect-[4/3] w-full bg-secondary object-cover ${style.image}`}
        />
      ) : (
        <div role="img" aria-label={messages.noImage} className={`aspect-[4/3] w-full bg-secondary ${style.image}`} />
      )}
      <div className={`flex flex-1 flex-col gap-2 ${style.body}`}>
        <h3 className="font-heading text-lg font-semibold text-foreground">{product.name}</h3>
        {product.short_description ? <p className="text-sm text-muted">{product.short_description}</p> : null}
      </div>
    </article>
  );
}
