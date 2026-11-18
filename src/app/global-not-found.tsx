/**
 * Unmatched route outside any site. Normally unreachable: the proxy answers unknown hosts
 * with a plain 404 and rewrites every site path under `/{site}/{locale}`.
 */
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Not found", robots: "noindex, nofollow" };

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, display: "grid", placeItems: "center", minHeight: "100dvh" }}>
        <main>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>404 · Page not found</h1>
        </main>
      </body>
    </html>
  );
}
