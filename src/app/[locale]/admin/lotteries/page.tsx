import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/dashboard/AdminShell";
import {
  openLotteryAction,
  closeLotteryAction,
  createLotteryAction,
} from "@/app/actions/lottery";
import { Card, CardContent } from "@/components/ui/Card";
import { LotteryStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Label, Input, Textarea } from "@/components/ui/Field";
import { Dices } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  getDictionary,
  getLocaleFromValue,
  localizePath,
  t,
} from "@/i18n/config";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const dict = getDictionary(getLocaleFromValue(rawLocale));
  return { title: dict.admin.titles.lotteries };
}

export default async function AdminLotteriesPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);
  const dict = getDictionary(locale);

  const profile = await getProfile();
  const supabase = await createClient();
  if (!profile) return null;

  const { data: lotteries } = await supabase
    .from("lotteries")
    .select("*, tickets(count)")
    .order("created_at", { ascending: false });

  return (
    <AdminShell name={profile.full_name ?? dict.common.admin} role={profile.role}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create form */}
        <Card className="lg:col-span-1">
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Dices className="h-5 w-5 text-brand-600" /> {dict.admin.createLottery}
            </h2>
            <form action={createLotteryAction} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="title">{dict.admin.title}</Label>
                <Input id="title" name="title" placeholder={dict.admin.titlePlaceholder} required />
              </div>
              <div>
                <Label htmlFor="description">{dict.admin.description}</Label>
                <Textarea id="description" name="description" rows={3} placeholder={dict.admin.descriptionPlaceholder} />
              </div>
              <div>
                <Label htmlFor="ticket_price">{dict.admin.ticketPrice}</Label>
                <Input id="ticket_price" name="ticket_price" type="number" defaultValue={300} min={1} />
              </div>
              <div>
                <Label htmlFor="max_ticket_number">{dict.admin.maxTicketNumber}</Label>
                <Input id="max_ticket_number" name="max_ticket_number" type="number" defaultValue={300} min={1} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="registration_start">{dict.admin.regStart}</Label>
                  <Input id="registration_start" name="registration_start" type="datetime-local" required />
                </div>
                <div>
                  <Label htmlFor="registration_end">{dict.admin.regClose}</Label>
                  <Input id="registration_end" name="registration_end" type="datetime-local" required />
                </div>
              </div>
              <div>
                <Label htmlFor="draw_date">{dict.admin.drawDate}</Label>
                <Input id="draw_date" name="draw_date" type="datetime-local" required />
              </div>
              <Button type="submit" className="w-full">{dict.admin.createLottery}</Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <div className="space-y-3 lg:col-span-2">
          {lotteries && lotteries.length > 0 ? (
            lotteries.map((l) => {
              const count = (l.tickets as unknown as { count: number }[] | null)?.length ?? 0;
              return (
                <Card key={l.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">{l.title}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(l.registration_start)} → {formatDate(l.draw_date)} · {l.ticket_price} ETB ·{" "}
                          {t(dict.admin.ticketsCount, { count: String(count) })}
                        </p>
                      </div>
                      <LotteryStatusBadge status={l.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {l.status === "upcoming" && (
                        <form action={openLotteryAction}>
                          <input type="hidden" name="id" value={l.id} />
                          <Button variant="secondary" size="sm">{dict.admin.openRegistration}</Button>
                        </form>
                      )}
                      {l.status === "active" && (
                        <form action={closeLotteryAction}>
                          <input type="hidden" name="id" value={l.id} />
                          <Button variant="danger" size="sm">{dict.admin.closeRegistration}</Button>
                        </form>
                      )}
                      <a href={localizePath(locale, `/admin/lotteries/${l.id}/edit`)}>
                        <Button variant="outline" size="sm">
                          {dict.admin.edit}
                        </Button>
                      </a>
                      {(l.status === "closed" || l.status === "active" || l.status === "drawing") && (
                        <a href={localizePath(locale, `/admin/lotteries/${l.id}/draw`)}>
                          <Button variant="gold" size="sm">{dict.admin.startDraw}</Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-sm text-slate-500">
                {dict.admin.noLotteriesLong}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminShell>
  );
}