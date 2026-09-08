"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/client";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "gold";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-sky-50 text-sky-700 ring-sky-600/20",
  gold: "bg-gradient-to-r from-gold-400 to-gold-500 text-slate-900",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

// Lottery status badge helper
export function LotteryStatusBadge({ status }: { status: string }) {
  const { dict } = useLocale();
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    upcoming: { label: dict.badges.upcoming, variant: "info" },
    active: { label: dict.badges.registrationOpen, variant: "success" },
    closed: { label: dict.badges.registrationClosed, variant: "warning" },
    drawing: { label: dict.badges.drawing, variant: "gold" },
    completed: { label: dict.badges.completed, variant: "default" },
  };
  const cfg = map[status] ?? { label: status, variant: "default" as BadgeVariant };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// Payment status badge helper
export function PaymentStatusBadge({ status }: { status: string }) {
  const { dict } = useLocale();
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    pending: { label: dict.badges.pending, variant: "warning" },
    verified: { label: dict.badges.verified, variant: "success" },
    rejected: { label: dict.badges.rejected, variant: "danger" },
  };
  const cfg = map[status] ?? { label: status, variant: "default" as BadgeVariant };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}