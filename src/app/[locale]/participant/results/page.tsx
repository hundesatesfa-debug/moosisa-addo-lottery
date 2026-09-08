import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { ParticipantShell } from "@/components/dashboard/ParticipantShell";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Trophy } from "lucide-react";
import { formatDate } from "@/lib/utils";
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
  return { title: dict.participant.titles.results };
}

export default async function ResultsPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);
  const dict = getDictionary(locale);

  const profile = await getProfile();
  const supabase = await createClient();
  if (!profile) return null;

  const { data: winners } = await supabase
    .from("winners")
    .select(
      "*, lotteries(title, draw_date), tickets(ticket_code), profiles(full_name)",
    )
    .order("selected_at", { ascending: false });

  const medal = { 1: "🥇", 2: "🥈", 3: "🥉" } as const;

  return (
    <ParticipantShell name={profile.full_name ?? dict.participant.role}>
      {winners && winners.length > 0 ? (
        <div className="space-y-6">
          {winners.map((w) => {
            const lottery = w.lotteries as unknown as { title?: string; draw_date?: string };
            const ticket = w.tickets as unknown as { ticket_code?: string };
            const winnerProfile = w.profiles as unknown as { full_name?: string };
            const isMe = w.user_id === profile.id;
            return (
              <Card
                key={w.id}
                className={
                  isMe
                    ? "overflow-hidden border-gold-400 ring-2 ring-gold-400"
                    : "overflow-hidden"
                }
              >
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold-50 text-3xl">
                    {medal[w.position as keyof typeof medal] ?? "🏅"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-extrabold text-slate-900">
                      {isMe
                        ? `${winnerProfile.full_name ?? dict.common.you} ${dict.participant.thatsYou}`
                        : winnerProfile.full_name ?? dict.common.anonymous}
                    </p>
                    <p className="text-sm text-slate-500">
                      {t(dict.participant.winnerLabel, {
                        position: String(w.position),
                        title: lottery.title ?? dict.common.unknown,
                      })}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {t(dict.participant.ticketDrawnLabel, {
                        code: ticket.ticket_code ?? "",
                        date: formatDate(w.selected_at),
                      })}
                    </p>
                  </div>
                  {isMe && (
                    <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-bold text-gold-600">
                      🎉 {dict.participant.youWon}
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title={dict.participant.noWinnersTitle}
          description={dict.participant.noWinnersText}
        />
      )}
    </ParticipantShell>
  );
}