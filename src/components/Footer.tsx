"use client";

import Link from "next/link";
import { ShieldCheck, Mail, Phone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLocale } from "@/i18n/client";

export function Footer() {
  const { dict } = useLocale();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-slate-500">
              {dict.footer.blurb}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{dict.footer.platform}</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link className="hover:text-brand-600" href="#how-it-works">{dict.footer.howItWorks}</Link></li>
              <li><Link className="hover:text-brand-600" href="#winners">{dict.nav.winners}</Link></li>
              <li><Link className="hover:text-brand-600" href="#faq">{dict.nav.faq}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{dict.footer.contact}</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@mosisaa.com</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +251 911 000 000</li>
              <li className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4" /> Addis Ababa, Ethiopia
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Mosisaa Addunyaa Abbaa Carraa. {dict.footer.rightsReserved}
          </p>
          <p className="text-xs text-slate-400">{dict.footer.responsible}</p>
        </div>
      </div>
    </footer>
  );
}