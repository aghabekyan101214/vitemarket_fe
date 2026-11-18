/**
 * Interface strings per language with fallback `pt-BR` → `pt` → `en`.
 * Safe for client components (no server-only imports, tiny dictionaries).
 */
import de from "./messages/de";
import en, { type Messages } from "./messages/en";
import fr from "./messages/fr";

export type { Messages };

const DICTIONARIES: Record<string, Messages> = { en, de, fr };

export function getMessages(locale: string): Messages {
  const language = locale.split("-")[0]!.toLowerCase();
  return DICTIONARIES[locale] ?? DICTIONARIES[language] ?? en;
}

export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** "8 Produkte" with `Intl.PluralRules` for the `de-DE` style tag. */
export function plural(
  forms: { one: string; other: string },
  count: number,
  langTag: string,
): string {
  const category = new Intl.PluralRules(langTag).select(count);
  const template = category === "one" ? forms.one : forms.other;
  return format(template, { count: new Intl.NumberFormat(langTag).format(count) });
}

/** Autonym for the language switcher: `de` → "Deutsch", `fr` → "Français". */
export function languageName(locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale;
    return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
  } catch {
    return locale;
  }
}
