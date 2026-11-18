/**
 * Site key → design id. The only place (with fonts.ts) that names site keys.
 * Moves to data once the backend adds `ThemeTokens.design` (FRONTEND_PLAN §1 #7).
 */
export const SITE_DESIGNS: Readonly<Record<string, string>> = {
  "nordic-home-de": "design-a",
  "nordic-home-fr": "design-b",
};

export function designIdForSite(siteKey: string): string {
  return SITE_DESIGNS[siteKey] ?? "base";
}
