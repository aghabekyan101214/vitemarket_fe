import Link from "next/link";
import type { NavItem, PageKind } from "@/types/api";

const linkClass =
  "inline-flex min-h-6 items-center py-2 text-sm font-medium text-foreground/80 hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:underline underline-offset-8 decoration-2 decoration-accent";

/**
 * One <nav> landmark. Desktop shows the list inline; on small screens a <details>
 * disclosure works without any JavaScript. The home item is covered by the brand link.
 */
export function Nav({
  items,
  current,
  label,
  menuLabel,
  align = "end",
}: {
  items: NavItem[];
  current: PageKind | null;
  label: string;
  menuLabel: string;
  align?: "start" | "center" | "end";
}) {
  const links = items.filter((i) => i.page !== "home");
  if (!links.length) return null;
  const list = (className: string) => (
    <ul className={className}>
      {links.map((item) => (
        <li key={item.page}>
          <Link href={item.path} className={linkClass} aria-current={item.page === current ? "page" : undefined}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
  const justify = { start: "justify-start", center: "justify-center", end: "justify-end" }[align];
  return (
    <nav aria-label={label}>
      {list(`hidden md:flex items-center gap-6 ${justify}`)}
      <details className="group relative md:hidden">
        <summary className="flex min-h-10 min-w-10 cursor-pointer list-none items-center gap-2 rounded-site border border-border px-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M4 7h16M4 12h16M4 17h16" className="group-open:hidden" />
            <path d="M6 6l12 12M18 6 6 18" className="hidden group-open:block" />
          </svg>
          {menuLabel}
        </summary>
        <div className="absolute right-0 z-20 mt-2 min-w-48 rounded-site border border-border bg-background p-3 shadow-lg">
          {list("flex flex-col gap-1")}
        </div>
      </details>
    </nav>
  );
}
