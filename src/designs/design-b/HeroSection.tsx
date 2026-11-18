import Image from "next/image";
import { Container } from "@/components/common/Container";
import { SmartLink } from "@/components/common/SmartLink";
import { buttonClass } from "@/components/common/styles";
import type { BlockProps } from "@/designs/types";
import { mediaUrl } from "@/lib/images/media";

/**
 * Design B hero: centered, airy, image framed underneath.
 * Placeholder until the Figma file is shared; replace the markup, keep the props.
 */
export function HeroSection({ block, ctx }: BlockProps<"hero">) {
  const Heading = ctx.heroIsH1 ? "h1" : "h2";
  const src = mediaUrl(ctx.mediaBaseUrl, block.image_key);
  return (
    <section className="bg-secondary">
      <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
        <Heading className="max-w-3xl font-heading text-4xl font-semibold italic tracking-tight text-foreground sm:text-6xl">
          {block.heading}
        </Heading>
        {block.subheading ? <p className="max-w-xl text-lg text-foreground/80">{block.subheading}</p> : null}
        {block.cta ? (
          <SmartLink href={block.cta.href} className={buttonClass}>
            {block.cta.label}
          </SmartLink>
        ) : null}
        {src ? (
          <div className="relative mt-8 aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-site shadow-xl">
            <Image src={src} alt="" fill preload fetchPriority="high" sizes="(min-width: 1024px) 64rem, 100vw" className="object-cover" />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
