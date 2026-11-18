import Link from "next/link";
import type { LanguageLink } from "@/designs/types";

/** Rendered only for multi-locale sites. Links go to the same page in the other locale. */
export function LanguageSwitcher({ languages, label }: { languages: LanguageLink[]; label: string }) {
  if (languages.length < 2) return null;
  return (
    <nav aria-label={label}>
      <ul className="flex items-center gap-1 text-sm">
        {languages.map((l) => (
          <li key={l.locale}>
            <Link
              href={l.href}
              hrefLang={l.lang}
              lang={l.lang}
              aria-current={l.current ? "true" : undefined}
              className="inline-flex min-h-6 min-w-6 items-center rounded-site px-2 py-1 font-medium uppercase text-muted hover:text-foreground aria-[current=true]:bg-secondary aria-[current=true]:text-foreground"
            >
              <span aria-hidden="true">{l.locale}</span>
              <span className="sr-only">{l.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
