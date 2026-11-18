import type { ComponentType } from "react";
import { Container } from "@/components/common/Container";
import type { HeaderProps } from "@/designs/types";
import type { HeaderStyle } from "@/types/api";
import { Brand } from "./Brand";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Nav } from "./Nav";

function parts(p: HeaderProps) {
  return {
    brand: (className = "") => (
      <Brand siteName={p.siteName} logo={p.logo} href={p.homeHref} current={p.current === "home"} className={className} />
    ),
    nav: (align: "start" | "center" | "end") => (
      <Nav items={p.nav} current={p.current} label={p.messages.mainNavigation} menuLabel={p.messages.menu} align={align} />
    ),
    languages: <LanguageSwitcher languages={p.languages} label={p.messages.languageSwitcher} />,
  };
}

/** Brand left, navigation and language right. */
export function MinimalHeader(p: HeaderProps) {
  const x = parts(p);
  return (
    <header className="border-b border-border bg-background">
      <Container className="flex min-h-16 items-center justify-between gap-6">
        {x.brand()}
        <div className="flex items-center gap-4">
          {x.nav("end")}
          {x.languages}
        </div>
      </Container>
    </header>
  );
}

/** Brand centered on its own row; navigation centered below. */
export function CenteredHeader(p: HeaderProps) {
  const x = parts(p);
  return (
    <header className="border-b border-border bg-background">
      <Container className="flex flex-col items-center gap-3 py-5">
        {x.brand("text-2xl sm:text-3xl")}
        <div className="flex w-full items-center justify-center gap-6">
          {x.nav("center")}
          {x.languages}
        </div>
      </Container>
    </header>
  );
}

/** Three columns: brand · navigation · language. */
export function SplitHeader(p: HeaderProps) {
  const x = parts(p);
  return (
    <header className="border-b border-border bg-background">
      <Container className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        {x.brand("justify-self-start")}
        <div className="justify-self-end md:justify-self-center">{x.nav("center")}</div>
        <div className="hidden justify-self-end md:block">{x.languages}</div>
        <div className="col-span-2 flex justify-end md:hidden">{x.languages}</div>
      </Container>
    </header>
  );
}

export const HEADER_VARIANTS: Record<HeaderStyle, ComponentType<HeaderProps>> = {
  minimal: MinimalHeader,
  centered: CenteredHeader,
  split: SplitHeader,
};

export function Header(props: HeaderProps) {
  const Variant = HEADER_VARIANTS[props.variant] ?? MinimalHeader;
  return <Variant {...props} />;
}
