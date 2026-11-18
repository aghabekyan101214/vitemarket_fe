import Link from "next/link";
import type { ReactNode } from "react";

/** Internal (site-relative, already locale-prefixed by the backend) → <Link>; else <a>. */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

export function SmartLink({
  href,
  className,
  children,
  ...rest
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-current"?: "page" | "true";
  hrefLang?: string;
  lang?: string;
}) {
  if (isInternalHref(href)) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}
