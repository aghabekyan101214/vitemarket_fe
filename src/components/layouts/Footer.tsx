import Link from "next/link";
import { Container } from "@/components/common/Container";
import type { FooterProps } from "@/designs/types";
import { format } from "@/lib/i18n/t";

/** Site name + © year + nav. Legal pages (Impressum etc.) are not in the backend yet. */
export function Footer({ siteName, nav, year, messages }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-border bg-secondary text-foreground">
      <Container className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">{format(messages.copyright, { year, site: siteName })}</p>
        <nav aria-label={messages.footerNavigation}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.page}>
                <Link href={item.path} className="inline-flex min-h-6 items-center hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
