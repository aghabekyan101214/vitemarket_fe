/**
 * The fixed icon set for `features[].icon` (free text in the backend). Unknown → no icon.
 */
const PATHS: Record<string, string> = {
  leaf: "M5 21c0-8 5-14 15-16-1 10-7 15-15 16Zm0 0 7-7",
  tree: "M12 3 6 11h3l-4 6h14l-4-6h3l-6-8Zm0 14v4",
  hammer: "m14 6 4 4M4 20l8.5-8.5M13 3l8 8-3 3-8-8 3-3Z",
  hand: "M7 11V5a1.5 1.5 0 0 1 3 0v5m0-1V3.5a1.5 1.5 0 0 1 3 0V10m0-5.5a1.5 1.5 0 0 1 3 0V11m0-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4 14.5a1.6 1.6 0 0 1 2.6-1.8L7 13",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Zm-3 9 2 2 4-4",
  truck: "M3 6h11v9H3zM14 9h4l3 3v3h-7M7 18a2 2 0 1 0 0-.1M17 18a2 2 0 1 0 0-.1",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z",
  check: "M5 12.5 10 17 19 7",
  heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3Z",
  recycle: "M7 19H4l3-5M17 19h3l-3-5M9 5l3-2 3 2M8.5 9 7 14m8.5-5L17 14M7 19h10",
};

export const ICON_NAMES = Object.keys(PATHS);

export function Icon({ name, className = "size-6" }: { name: string | null | undefined; className?: string }) {
  const d = name ? PATHS[name.trim().toLowerCase()] : undefined;
  if (!d) return null;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}
