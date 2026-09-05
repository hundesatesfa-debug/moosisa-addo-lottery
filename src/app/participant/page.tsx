import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { ParticipantShell } from "@/components/dashboard/ParticipantShell";
import { BuyButton } from "@/components/dashboard/BuyButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, LotteryStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Ticket, Trophy, CalendarClock, CheckCircle2 } from "lucide-react";
import { formatETB, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Dashboard" };

export default async function ParticipantDashboardPage() {
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

  return (
    <ParticipantShell name={profile.full_name ?? "Participant"}>
      <div className="space-y-6">
        {/* Hero CTA / Active lottery */}
        {activeLottery ? (
          <Card className="overflow-hidden border-brand-100 bg-gradient-to-br from-brand-50 to-violet-50">
            <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <LotteryStatusBadge status={activeLottery.status} />
                  <span className="text-xs text-slate-500">
                    Draw: {formatDate(activeLottery.draw_date)}
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
                    {formatETB(activeLottery.ticket_price)} / ticket
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <CalendarClock className="h-4 w-4" />
                    Closes {formatDate(activeLottery.registration_end)}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Trophy className="h-4 w-4 text-gold-500" /> 3 winners
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
                title="No active lottery right now"
                description="A new round will open soon. Check back or watch your email for the announcement."
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
                  Congratulations! {profile.full_name?.split(" ")[0] ?? "You"} are a winner! 🎉
                </h3>
                <p className="text-sm font-medium text-slate-800">
                  Check the Results page to see your prize position.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My tickets */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">My Tickets</h2>
            <Link href="/participant/tickets">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>

          {myTickets && myTickets.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {myTickets.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-sm font-bold text-slate-900">
                          {t.ticket_code}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {(t.lotteries as unknown as { title?: string })?.title}
                        </p>
                      </div>
                      <PaymentStatusBadge status={t.payment_status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        {formatETB(Number(t.price_paid))}
                      </span>
                      <span className="text-slate-400">
                        {formatDate(t.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Ticket}
              title="No tickets yet"
              description="Grab a ticket to the current lottery above to enter the next draw."
            />
          )}
        </div>
      </div>
    </ParticipantShell>
  );
}