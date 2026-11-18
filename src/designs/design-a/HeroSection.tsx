import Image from "next/image";
import { Container } from "@/components/common/Container";
import { SmartLink } from "@/components/common/SmartLink";
import { buttonClass } from "@/components/common/styles";
import type { BlockProps } from "@/designs/types";
import { mediaUrl } from "@/lib/images/media";

/**
 * Design A hero: left-aligned editorial type on a wide band, image below at 21:9.
 * Placeholder until the Figma file is shared; replace the markup, keep the props.
 */
export function HeroSection({ block, ctx }: BlockProps<"hero">) {
  const Heading = ctx.heroIsH1 ? "h1" : "h2";
  const src = mediaUrl(ctx.mediaBaseUrl, block.image_key);
  return (
    <section className="border-b border-border">
      <Container className="py-20 sm:py-28">
        <p aria-hidden="true" className="mb-6 h-1 w-16 bg-accent" />
        <Heading className="max-w-4xl font-heading text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-7xl">
          {block.heading}
        </Heading>
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          {block.subheading ? <p className="max-w-xl text-lg text-muted">{block.subheading}</p> : <span />}
          {block.cta ? (
            <SmartLink href={block.cta.href} className={buttonClass}>
              {block.cta.label}
            </SmartLink>
          ) : null}
        </div>
      </Container>
      {src ? (
        <div className="relative aspect-[21/9] w-full bg-secondary">
          <Image src={src} alt="" fill preload fetchPriority="high" sizes="100vw" className="object-cover" />
        </div>
      ) : null}
    </section>
  );
}
