/** Interface strings only. All content (titles, blocks, products, nav labels) comes from the backend. */
const en = {
  skipToContent: "Skip to content",
  menu: "Menu",
  mainNavigation: "Main",
  languageSwitcher: "Language",
  footerNavigation: "Footer",
  copyright: "© {year} {site}",
  featuredFallbackHeading: "Featured products",
  featuresFallbackHeading: "Highlights",
  productCount: { one: "{count} product", other: "{count} products" },
  emptyProducts: "No products are available right now. Please check back soon.",
  noImage: "No image available",
  notFoundTitle: "Page not found",
  notFoundBody: "The page you are looking for doesn't exist or has moved.",
  backHome: "Back to the home page",
  errorTitle: "Something went wrong",
  errorBody: "This page couldn't be loaded. Please try again in a moment.",
  retry: "Try again",
  loading: "Loading…",
};

export type Messages = {
  [K in keyof typeof en]: (typeof en)[K] extends string ? string : { one: string; other: string };
};

export default en satisfies Messages;
