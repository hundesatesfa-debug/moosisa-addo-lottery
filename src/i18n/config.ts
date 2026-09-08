import { en, type Dictionary } from "./dictionaries/en";
import { om } from "./dictionaries/om";

export type { Dictionary };

export const locales = ["en", "om"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "NEXT_LOCALE";

const dictionaries: Record<Locale, Dictionary> = { en, om };

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "om";
}

export function getLocaleFromValue(value?: string | null): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function detectLocaleFromHeaders(
  acceptLanguage?: string | null,
): Locale {
  if (!acceptLanguage) return defaultLocale;
  return acceptLanguage.toLowerCase().includes("om") ? "om" : defaultLocale;
}

export function localizePath(locale: Locale, path: string): string {
  if (path === "/") return `/${locale}`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${p}`;
}

export function t(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : `{${key}}`,
  );
}