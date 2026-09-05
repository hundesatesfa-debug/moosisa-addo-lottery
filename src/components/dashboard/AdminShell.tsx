"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dices,
  Ticket,
  Trophy,
  Users,
  ScrollText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

export function AdminShell({
  children,
  name,
  role,
}: {
  children: React.ReactNode;
  name: string;
  role: UserRole;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isSuper = role === "super_admin";

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/lotteries", label: "Lotteries", icon: Dices },
    { href: "/admin/tickets", label: "Tickets", icon: Ticket },
    { href: "/admin/winners", label: "Winners", icon: Trophy },
    ...(isSuper
      ? [
          { href: "/admin/users", label: "Users", icon: Users },
          { href: "/admin/activity", label: "Activity", icon: ScrollText },
        ]
      : []),
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
          <span className="ml-3 text-sm font-bold text-slate-900">Admin</span>
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
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {role === "super_admin" ? "Super Admin" : "Admin"}
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="h-5 w-5" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:hidden">
          <Logo compact />
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        <main className="min-h-[calc(100vh-4rem)]">
          <div className="border-b border-slate-200 bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <p className="text-sm text-slate-400">Admin Dashboard</p>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{name}</h1>
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}