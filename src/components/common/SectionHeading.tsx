import type { ReactNode } from "react";

export function SectionHeading({
  children,
  id,
  visuallyHidden = false,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  visuallyHidden?: boolean;
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={
        visuallyHidden ? "sr-only" : `font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl ${className}`
      }
    >
      {children}
    </h2>
  );
}
