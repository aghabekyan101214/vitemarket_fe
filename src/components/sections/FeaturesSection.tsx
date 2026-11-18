import { Container } from "@/components/common/Container";
import { Icon } from "@/components/common/Icon";
import { SectionHeading } from "@/components/common/SectionHeading";
import type { BlockProps } from "@/designs/types";

export function FeaturesSection({ block, ctx }: BlockProps<"features">) {
  return (
    <section className="py-16">
      <Container>
        <SectionHeading visuallyHidden={!block.heading} className="mb-10">
          {block.heading ?? ctx.messages.featuresFallbackHeading}
        </SectionHeading>
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {block.items.map((item) => (
            <li key={item.title} className="flex gap-4">
              <Icon name={item.icon} className="size-7 shrink-0 text-accent" />
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>
                {item.description ? <p className="mt-1 text-muted">{item.description}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
