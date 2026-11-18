import type { ReactNode } from "react";
import type { Design, FooterProps, HeaderProps } from "@/designs/types";

/** Landmarks: header · main (#main, the skip-link target) · footer. */
export function SiteShell({
  design,
  header,
  footer,
  children,
}: {
  design: Design;
  header: HeaderProps;
  footer: FooterProps;
  children: ReactNode;
}) {
  const { Header, Footer } = design;
  return (
    <>
      <Header {...header} />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer {...footer} />
    </>
  );
}
