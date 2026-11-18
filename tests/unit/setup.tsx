import type { ReactNode } from "react";
import { vi } from "vitest";

// next/image and next/link need the Next runtime; plain elements are enough to assert markup.
vi.mock("next/image", () => ({
  default: ({ src, alt, fetchPriority, ...props }: Record<string, unknown>) => {
    const rest = Object.fromEntries(Object.entries(props).filter(([k]) => k !== "fill" && k !== "preload"));
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={String(src)} alt={String(alt)} data-fetchpriority={fetchPriority as string} {...rest} />;
  },
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
