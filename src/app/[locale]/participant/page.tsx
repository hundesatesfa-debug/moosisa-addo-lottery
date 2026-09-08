import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { ParticipantShell } from "@/components/dashboard/ParticipantShell";
import { BuyButton } from "@/components/dashboard/BuyButton";
import { Card, CardContent } from "@/components/ui/Card";
import { LotteryStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Ticket, Trophy, CalendarClock } from "lucide-react";
import { formatETB, formatDate } from "@/lib/utils";
import { getDictionary, getLocaleFromValue, localizePath, t } from "@/i18n/config";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const dict = getDictionary(getLocaleFromValue(rawLocale));
  return { title: dict.participant.titles.dashboard };
}

export default async function ParticipantDashboardPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);
  const dict = getDictionary(locale);

  const profile = await getProfile();
  const supabase = await createClient();

  if (!profile) return null;

  const { data: activeLottery } = await supabase
    .from("lotteries")
    .select("*")
    .in("status", ["upcoming", "active"])
    .order("draw_date", { ascending: true })
    .limit(1)
    .single()
    .then((r) => (r.error ? { data: null } : r));

  const { data: myTickets } = await supabase
    .from("tickets")
    .select("*, lotteries(title, draw_date, status)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: myWins } = await supabase
    .from("winners")
    .select("*, lotteries(title, draw_date)")
    .eq("user_id", profile.id);

  const firstName = profile.full_name?.split(" ")[0] ?? dict.common.you;

  return (
    <ParticipantShell name={profile.full_name ?? dict.participant.role}>
      <div className="space-y-6">
        {/* Hero CTA / Active lottery */}
        {activeLottery ? (
          <Card className="overflow-hidden border-brand-100 bg-gradient-to-br from-brand-50 to-violet-50">
            <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <LotteryStatusBadge status={activeLottery.status} />
                  <span className="text-xs text-slate-500">
                    {t(dict.participant.drawLabel, { date: formatDate(activeLottery.draw_date) })}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                  {activeLottery.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {activeLottery.description}
                </p>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="font-bold text-brand-700">
                    {t(dict.participant.pricePerTicket, { price: formatETB(activeLottery.ticket_price) })}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <CalendarClock className="h-4 w-4" />
                    {t(dict.participant.closesLabel, { date: formatDate(activeLottery.registration_end) })}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Trophy className="h-4 w-4 text-gold-500" /> {dict.participant.winnersCount}
                  </span>
                </div>
              </div>
              <div className="w-full sm:w-64">
                <BuyButton
                  lotteryId={activeLottery.id}
                  price={Number(activeLottery.ticket_price)}
                  title={activeLottery.title}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={CalendarClock}
                title={dict.participant.noActiveLottery}
                description={dict.participant.noActiveLotteryText}
              />
            </CardContent>
          </Card>
        )}

        {/* Winner brag card */}
        {myWins && myWins.length > 0 && (
          <Card className="overflow-hidden bg-gradient-to-r from-gold-400 to-gold-500">
            <CardContent className="flex items-center gap-4 p-6">
              <Trophy className="h-10 w-10 text-white" />
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {t(dict.participant.congrats, { name: firstName })}
                </h3>
                <p className="text-sm font-medium text-slate-800">
                  {dict.participant.winsText}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My tickets */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{dict.participant.myTickets}</h2>
            <Link href={localizePath(locale, "/participant/tickets")}>
              <Button variant="ghost" size="sm">{dict.common.viewAll}</Button>
            </Link>
          </div>

          {myTickets && myTickets.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {myTickets.map((tk) => (
                <Card key={tk.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-sm font-bold text-slate-900">
                          {tk.ticket_code}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {(tk.lotteries as unknown as { title?: string })?.title}
                        </p>
                      </div>
                      <PaymentStatusBadge status={tk.payment_status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        {formatETB(Number(tk.price_paid))}
                      </span>
                      <span className="text-slate-400">
                        {formatDate(tk.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Ticket}
              title={dict.participant.noTicketsTitle}
              description={dict.participant.noTicketsText}
            />
          )}
        </div>
      </div>
    </ParticipantShell>
  );
}