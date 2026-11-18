/**
 * next/image `loaderFile` (runs on server and client, so only NEXT_PUBLIC_ env).
 *
 * - cloudflare: Cloudflare Image Transformations on the media origin,
 *   `${origin}/cdn-cgi/image/width=…,quality=…,format=auto/${path}`.
 * - none (local): the raw URL, with `w` so each srcset entry is distinct.
 */
export interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

export function buildImageUrl(provider: string | undefined, { src, width, quality }: LoaderArgs): string {
  const q = quality ?? 75;
  if (provider === "cloudflare") {
    const options = `width=${width},quality=${q},format=auto`;
    if (/^https?:\/\//.test(src)) {
      const url = new URL(src);
      return `${url.origin}/cdn-cgi/image/${options}${url.pathname}`;
    }
    return `/cdn-cgi/image/${options}${src.startsWith("/") ? src : `/${src}`}`;
  }
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}

export default function imageLoader(args: LoaderArgs): string {
  return buildImageUrl(process.env.NEXT_PUBLIC_IMAGE_PROVIDER, args);
}
