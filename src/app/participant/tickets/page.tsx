import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { ParticipantShell } from "@/components/dashboard/ParticipantShell";
import { Card, CardContent } from "@/components/ui/Card";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Ticket } from "lucide-react";
import { formatETB, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "My Tickets" };

export default async function MyTicketsPage() {
  const profile = await getProfile();
  const supabase = await createClient();
  if (!profile) return null;

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*, lotteries(title, draw_date, status)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <ParticipantShell name={profile.full_name ?? "Participant"}>
      {tickets && tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-base font-extrabold text-brand-700">
                      {t.ticket_code}
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      {(t.lotteries as unknown as { title?: string })?.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Bought {formatDateTime(t.created_at)} · {formatETB(Number(t.price_paid))}
                    </p>
                  </div>
                  <PaymentStatusBadge status={t.payment_status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Ticket}
          title="You haven't bought any tickets yet"
          action={
            <Link href="/participant">
              <Button>Browse Active Lottery</Button>
            </Link>
          }
        />
      )}
    </ParticipantShell>
  );
}