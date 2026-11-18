import { Container } from "@/components/common/Container";
import { SmartLink } from "@/components/common/SmartLink";
import type { BlockProps } from "@/designs/types";

export function CtaSection({ block }: BlockProps<"cta">) {
  return (
    <section className="py-16">
      <Container>
        <div className="flex flex-col items-start gap-6 rounded-site bg-primary px-8 py-12 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-semibold sm:text-3xl">{block.heading}</h2>
            {block.body ? <p className="mt-2 max-w-prose opacity-90">{block.body}</p> : null}
          </div>
          <SmartLink
            href={block.link.href}
            className="inline-flex min-h-11 items-center rounded-site bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary transition hover:opacity-90 motion-reduce:transition-none"
          >
            {block.link.label}
          </SmartLink>
        </div>
      </Container>
    </section>
  );
}
