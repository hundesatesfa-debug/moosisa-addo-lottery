"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Trophy,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { logoutAction } from "@/app/actions/auth";
import { LanguageSwitch } from "@/i18n/language-switcher";
import { useLocale } from "@/i18n/client";
import { localizePath } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function ParticipantShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  const pathname = usePathname();
  const { locale, dict } = useLocale();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: localizePath(locale, "/participant"), label: dict.admin.overview, icon: LayoutDashboard },
    { href: localizePath(locale, "/participant/tickets"), label: dict.participant.titles.tickets, icon: Ticket },
    { href: localizePath(locale, "/participant/results"), label: dict.participant.titles.results, icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          <Logo compact />
          <span className="ml-3 text-sm font-bold text-slate-900">{dict.participant.role}</span>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/20"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="h-5 w-5" />
              {dict.nav.logout}
            </button>
          </form>
          <div className="mt-2 border-t border-slate-100 pt-2">
            <LanguageSwitch className="w-full justify-center" />
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:hidden">
          <Logo compact />
          <div className="flex items-center gap-1">
            <LanguageSwitch />
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label={dict.nav.toggleMenu}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)]">
          {/* Page header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-brand-700 to-violet-700 px-4 py-6 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <p className="text-sm text-brand-100">{dict.nav.welcomeBack}</p>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{name}</h1>
            </div>
          </div>
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}