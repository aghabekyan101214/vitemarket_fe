import { Container } from "@/components/common/Container";
import { RichText } from "@/components/common/RichText";
import { SectionHeading } from "@/components/common/SectionHeading";
import type { BlockProps } from "@/designs/types";

/** Also the "company introduction" section: the design decides how a text block looks. */
export function TextSection({ block }: BlockProps<"text">) {
  return (
    <section className="py-16">
      <Container className="max-w-3xl">
        {block.heading ? <SectionHeading className="mb-6">{block.heading}</SectionHeading> : null}
        <RichText html={block.body} />
      </Container>
    </section>
  );
}
