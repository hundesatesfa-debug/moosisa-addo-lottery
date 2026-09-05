import Link from "next/link";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-lg shadow-brand-600/30 ring-1 ring-white/20">
        <Trophy className="h-5 w-5 text-gold-400" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-extrabold tracking-tight text-slate-900">
            Mosisaa <span className="text-gradient-gold">Addunyaa</span>
          </span>
          <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Abbaa Carraa
          </span>
        </span>
      )}
    </Link>
  );
}