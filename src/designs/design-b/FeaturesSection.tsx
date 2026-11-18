import { Container } from "@/components/common/Container";
import { Icon } from "@/components/common/Icon";
import { SectionHeading } from "@/components/common/SectionHeading";
import type { BlockProps } from "@/designs/types";

/** Design B features: centered cards on the secondary color. Placeholder until Figma B. */
export function FeaturesSection({ block, ctx }: BlockProps<"features">) {
  return (
    <section className="py-20">
      <Container>
        <SectionHeading visuallyHidden={!block.heading} className="mb-12 text-center">
          {block.heading ?? ctx.messages.featuresFallbackHeading}
        </SectionHeading>
        <ul className="grid gap-6 sm:grid-cols-3">
          {block.items.map((item) => (
            <li key={item.title} className="flex flex-col items-center gap-3 rounded-site bg-secondary px-6 py-10 text-center">
              <Icon name={item.icon} className="size-8 text-accent" />
              <h3 className="font-heading text-xl font-semibold text-foreground">{item.title}</h3>
              {item.description ? <p className="text-foreground/80">{item.description}</p> : null}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
