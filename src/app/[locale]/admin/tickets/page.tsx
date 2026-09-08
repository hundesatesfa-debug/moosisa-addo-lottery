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
import { getDictionary, getLocaleFromValue } from "@/i18n/config";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const dict = getDictionary(getLocaleFromValue(rawLocale));
  return { title: dict.admin.titles.tickets };
}

export default async function AdminTicketsPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);
  const dict = getDictionary(locale);

  const profile = await getProfile();
  const supabase = await createClient();
  if (!profile) return null;

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*, lotteries(title), profiles(full_name, phone)")
    .order("created_at", { ascending: false });

  return (
    <AdminShell name={profile.full_name ?? dict.common.admin} role={profile.role}>
      {tickets && tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((tick) => {
            const lot = tick.lotteries as unknown as { title?: string };
            const owner = tick.profiles as unknown as { full_name?: string; phone?: string };
            return (
              <Card key={tick.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-extrabold text-brand-700">
                      {tick.ticket_code}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-700">
                      {owner.full_name ?? dict.common.unknown} · {owner.phone ?? dict.common.noPhone}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {lot.title} · {formatDateTime(tick.created_at)} · {tick.price_paid} ETB
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PaymentStatusBadge status={tick.payment_status} />
                    {tick.payment_status === "pending" && (
                      <>
                        <form action={verifyTicketAction}>
                          <input type="hidden" name="ticket_id" value={tick.id} />
                          <input type="hidden" name="status" value="verified" />
                          <Button variant="success" size="sm">{dict.common.verify}</Button>
                        </form>
                        <form action={verifyTicketAction}>
                          <input type="hidden" name="ticket_id" value={tick.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <Button variant="danger" size="sm">{dict.common.reject}</Button>
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
          title={dict.admin.noTicketsTitle}
          description={dict.admin.noTicketsText}
        />
      )}
    </AdminShell>
  );
}