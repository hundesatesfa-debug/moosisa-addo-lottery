import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { verifyTicketAction } from "@/app/actions/lottery";
import { AdminShell } from "@/components/dashboard/AdminShell";
import { Card, CardContent } from "@/components/ui/Card";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Ticket } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Tickets & Payments" };

export default async function AdminTicketsPage() {
  const profile = await getProfile();
  const supabase = await createClient();
  if (!profile) return null;

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*, lotteries(title), profiles(full_name, phone)")
    .order("created_at", { ascending: false });

  return (
    <AdminShell name={profile.full_name ?? "Admin"} role={profile.role}>
      {tickets && tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((t) => {
            const lot = t.lotteries as unknown as { title?: string };
            const owner = t.profiles as unknown as { full_name?: string; phone?: string };
            return (
              <Card key={t.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-extrabold text-brand-700">
                      {t.ticket_code}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-700">
                      {owner.full_name ?? "Unknown"} · {owner.phone ?? "no phone"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {lot.title} · {formatDateTime(t.created_at)} · {t.price_paid} ETB
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PaymentStatusBadge status={t.payment_status} />
                    {t.payment_status === "pending" && (
                      <>
                        <form action={verifyTicketAction}>
                          <input type="hidden" name="ticket_id" value={t.id} />
                          <input type="hidden" name="status" value="verified" />
                          <Button variant="success" size="sm">Verify</Button>
                        </form>
                        <form action={verifyTicketAction}>
                          <input type="hidden" name="ticket_id" value={t.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <Button variant="danger" size="sm">Reject</Button>
                        </form>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Ticket}
          title="No tickets yet"
          description="Tickets appear here as participants buy them."
        />
      )}
    </AdminShell>
  );
}