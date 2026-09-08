import { cookies } from "next/headers";
import {
  getDictionary,
  getLocaleFromValue,
  localeCookieName,
  type Dictionary,
  type Locale,
} from "./config";

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  return getLocaleFromValue(store.get(localeCookieName)?.value);
}

export async function getServerDict(): Promise<{
  locale: Locale;
  dict: Dictionary;
}> {
  const locale = await getServerLocale();
  return { locale, dict: getDictionary(locale) };
}

export async function localizedPath(path: string): Promise<string> {
  const locale = await getServerLocale();
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}