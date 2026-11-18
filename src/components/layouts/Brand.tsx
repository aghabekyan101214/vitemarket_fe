import Link from "next/link";
import type { Asset } from "@/types/api";

export function Brand({
  siteName,
  logo,
  href,
  current,
  className = "",
}: {
  siteName: string;
  logo: Asset | null;
  href: string;
  current: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`inline-flex min-h-6 items-center font-heading text-xl font-semibold tracking-tight text-foreground ${className}`}
    >
      {logo ? (
        // Logos come without dimensions from the API; a fixed height keeps the layout stable.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo.url} alt={siteName} className="h-8 w-auto" />
      ) : (
        siteName
      )}
    </Link>
  );
}
