import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "./Container";

/** Shared look of the 404 and error pages (inside the site layout, so branding stays). */
export function StatusPage({
  siteName,
  homeHref,
  title,
  body,
  action,
}: {
  siteName: string;
  homeHref: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <>
      <header className="border-b border-border">
        <Container className="flex min-h-16 items-center">
          <Link href={homeHref} className="font-heading text-xl font-semibold">
            {siteName}
          </Link>
        </Container>
      </header>
      <main id="main" tabIndex={-1} className="flex flex-1 items-center py-24 focus:outline-none">
        <Container className="flex max-w-2xl flex-col items-start gap-6">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="text-lg text-muted">{body}</p>
          {action}
        </Container>
      </main>
    </>
  );
}
