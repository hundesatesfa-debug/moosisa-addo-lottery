"use client";

import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { useLocale } from "./client";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "./config";
import { cn } from "@/lib/utils";

export function pathWithoutLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (segments.length > 1 && isLocale(segments[1])) {
    return "/" + segments.slice(2).join("/");
  }
  return pathname;
}

export function LanguageSwitch({ className }: { className?: string }) {
  const { locale } = useLocale();
  const pathname = usePathname();

  const targetLocale: Locale = locale === "en" ? "om" : "en";
  const targetPath = pathWithoutLocale(pathname);

  function switchLanguage() {
    document.cookie = `${localeCookieName}=${targetLocale}; path=/; max-age=31536000; samesite=lax`;
    const url = `/${targetLocale}${targetPath === "/" ? "" : targetPath}`;
    window.location.href = url;
  }

  return (
    <button
      type="button"
      onClick={switchLanguage}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
        "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        className,
      )}
      aria-label={`Switch language to ${targetLocale === "en" ? "English" : "Afaan Oromoo"}`}
    >
      <Languages className="h-4 w-4" />
      <span>{targetLocale === "en" ? "EN" : "OM"}</span>
    </button>
  );
}

export function defaultLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split("/");
  if (segments.length > 1 && isLocale(segments[1])) {
    return segments[1] as Locale;
  }
  return defaultLocale;
}