"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { LanguageSwitch } from "@/i18n/language-switcher";
import { useLocale } from "@/i18n/client";
import { localizePath } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function SiteNav({
  authed,
  role,
}: {
  authed: boolean;
  role: string | null;
}) {
  const [open, setOpen] = useState(false);
  const { locale, dict } = useLocale();

  const dashboardHref =
    role === "admin" || role === "super_admin"
      ? localizePath(locale, "/admin")
      : localizePath(locale, "/participant");

  const links = [
    { href: "#how-it-works", label: dict.nav.howItWorks },
    { href: "#lottery", label: dict.nav.currentLottery },
    { href: "#winners", label: dict.nav.winners },
    { href: "#faq", label: dict.nav.faq },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {authed ? (
            <Link href={dashboardHref}>
              <Button variant="gold">
                <User className="h-4 w-4" />
                {dict.nav.myDashboard}
              </Button>
            </Link>
          ) : (
            <>
              <Link href={localizePath(locale, "/auth/login")}>
                <Button variant="ghost">{dict.nav.logIn}</Button>
              </Link>
              <Link href={localizePath(locale, "/auth/signup")}>
                <Button>{dict.nav.getStarted}</Button>
              </Link>
            </>
          )}
          <LanguageSwitch />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitch />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 md:hidden",
          open ? "max-h-96 border-t border-slate-200 bg-white" : "max-h-0",
        )}
      >
        <div className="space-y-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 pb-1">
            {authed ? (
              <Link href={dashboardHref} onClick={() => setOpen(false)}>
                <Button className="w-full" variant="gold">
                  {dict.nav.myDashboard}
                </Button>
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href={localizePath(locale, "/auth/login")} onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    {dict.nav.logIn}
                  </Button>
                </Link>
                <Link href={localizePath(locale, "/auth/signup")} onClick={() => setOpen(false)}>
                  <Button className="w-full">{dict.nav.signUp}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}