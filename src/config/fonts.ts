/**
 * next/font registry: family name (as stored in backend theme tokens) → self-hosted font.
 * Adding a Google font is one entry here plus a deploy. Subsets cover de/en/fr; extend
 * them when a site adds a language with other characters.
 *
 * `preload: false` because the layout imports every registered font; each site only
 * downloads the two families its theme uses (fallback metrics keep CLS at zero).
 */
import { Fraunces, Inter, Playfair_Display, Source_Sans_3 } from "next/font/google";
import { type RegisteredFont, SANS_STACK, SERIF_STACK } from "@/lib/theme/fonts";

const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--ff-fraunces", display: "swap", preload: false });
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--ff-inter", display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], variable: "--ff-playfair", display: "swap", preload: false });
const sourceSans = Source_Sans_3({ subsets: ["latin", "latin-ext"], variable: "--ff-source-sans", display: "swap", preload: false });

export const FONTS: Readonly<Record<string, RegisteredFont>> = {
  Fraunces: { className: fraunces.variable, variable: "--ff-fraunces", fallback: SERIF_STACK },
  Inter: { className: inter.variable, variable: "--ff-inter", fallback: SANS_STACK },
  "Playfair Display": { className: playfair.variable, variable: "--ff-playfair", fallback: SERIF_STACK },
  "Source Sans 3": { className: sourceSans.variable, variable: "--ff-source-sans", fallback: SANS_STACK },
};
