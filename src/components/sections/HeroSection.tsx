import Image from "next/image";
import { Container } from "@/components/common/Container";
import { SmartLink } from "@/components/common/SmartLink";
import { buttonClass } from "@/components/common/styles";
import type { BlockProps } from "@/designs/types";
import { mediaUrl } from "@/lib/images/media";


/**
 * Image (if any) in a fixed-ratio box with `fill` → no CLS. `alt=""`: the backend has no
 * hero alt text yet (FRONTEND_PLAN §1 #5), so the image is decorative.
 */
export function HeroSection({ block, ctx }: BlockProps<"hero">) {
  const Heading = ctx.heroIsH1 ? "h1" : "h2";
  const src = mediaUrl(ctx.mediaBaseUrl, block.image_key);
  return (
    <section className="bg-secondary">
      <Container className="grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <Heading className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {block.heading}
          </Heading>
          {block.subheading ? <p className="max-w-prose text-lg text-foreground/80">{block.subheading}</p> : null}
          {block.cta ? (
            <SmartLink href={block.cta.href} className={buttonClass}>
              {block.cta.label}
            </SmartLink>
          ) : null}
        </div>
        {src ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-site bg-background">
            <Image src={src} alt="" fill preload fetchPriority="high" sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
