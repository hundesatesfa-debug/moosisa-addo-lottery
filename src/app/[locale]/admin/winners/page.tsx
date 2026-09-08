import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/dashboard/AdminShell";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Trophy } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import {
  getDictionary,
  getLocaleFromValue,
  t,
} from "@/i18n/config";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const dict = getDictionary(getLocaleFromValue(rawLocale));
  return { title: dict.admin.titles.winners };
}

export default async function AdminWinnersPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);
  const dict = getDictionary(locale);

  const profile = await getProfile();
  const supabase = await createClient();
  if (!profile) return null;

  const { data: winners } = await supabase
    .from("winners")
    .select("*, lotteries(title), profiles(full_name, phone), tickets(ticket_code)")
    .order("selected_at", { ascending: false });

  const medal = { 1: "🥇", 2: "🥈", 3: "🥉" } as const;

  return (
    <AdminShell name={profile.full_name ?? dict.common.admin} role={profile.role}>
      {winners && winners.length > 0 ? (
        <div className="space-y-3">
          {winners.map((w) => {
            const lot = w.lotteries as unknown as { title?: string };
            const owner = w.profiles as unknown as { full_name?: string; phone?: string };
            const tic = w.tickets as unknown as { ticket_code?: string };
            return (
              <Card key={w.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-50 text-2xl">
                    {medal[w.position as keyof typeof medal] ?? "🏅"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">
                      {t(dict.admin.winnerLabel, {
                        position: String(w.position),
                        name: owner.full_name ?? dict.common.anonymous,
                      })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {lot.title} · {owner.phone ?? ""} · {tic.ticket_code}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatDateTime(w.selected_at)}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title={dict.admin.noWinnersTitle}
          description={dict.admin.noWinnersText}
        />
      )}
    </AdminShell>
  );
}