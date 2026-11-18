/** Media URL for an object key (mirror of backend `core/media.public_url`). */
export function mediaUrl(baseUrl: string, key: string | null | undefined): string | null {
  if (!key) return null;
  return `${baseUrl.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}

/** `sizes` for ProductGrid: 1 / 2 / 3 / 4 columns, capped by the 80rem container. */
export const GRID_SIZES = "(min-width: 1280px) 304px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
