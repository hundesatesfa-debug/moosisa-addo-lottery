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

export const metadata: Metadata = { title: "Manage Lotteries" };

export default async function AdminLotteriesPage() {
  const profile = await getProfile();
  const supabase = await createClient();
  if (!profile) return null;

  const { data: lotteries } = await supabase
    .from("lotteries")
    .select("*, tickets(count)")
    .order("created_at", { ascending: false });

  return (
    <AdminShell name={profile.full_name ?? "Admin"} role={profile.role}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create form */}
        <Card className="lg:col-span-1">
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Dices className="h-5 w-5 text-brand-600" /> Create Lottery
            </h2>
            <form action={createLotteryAction} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Round 1" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} placeholder="Describe the round" />
              </div>
              <div>
                <Label htmlFor="ticket_price">Ticket Price (ETB)</Label>
                <Input id="ticket_price" name="ticket_price" type="number" defaultValue={300} min={1} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="registration_start">Reg. Start</Label>
                  <Input id="registration_start" name="registration_start" type="datetime-local" required />
                </div>
                <div>
                  <Label htmlFor="registration_end">Reg. Close</Label>
                  <Input id="registration_end" name="registration_end" type="datetime-local" required />
                </div>
              </div>
              <div>
                <Label htmlFor="draw_date">Draw Date</Label>
                <Input id="draw_date" name="draw_date" type="datetime-local" required />
              </div>
              <Button type="submit" className="w-full">Create Lottery</Button>
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
                          {formatDate(l.registration_start)} → {formatDate(l.draw_date)} · {l.ticket_price} ETB · {count} tickets
                        </p>
                      </div>
                      <LotteryStatusBadge status={l.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {l.status === "upcoming" && (
                        <form action={openLotteryAction}>
                          <input type="hidden" name="id" value={l.id} />
                          <Button variant="secondary" size="sm">Open registration</Button>
                        </form>
                      )}
                      {l.status === "active" && (
                        <form action={closeLotteryAction}>
                          <input type="hidden" name="id" value={l.id} />
                          <Button variant="danger" size="sm">Close registration</Button>
                        </form>
                      )}
                      <a href={`/admin/lotteries/${l.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </a>
                      {(l.status === "closed" || l.status === "active" || l.status === "drawing") && (
                        <a href={`/admin/lotteries/${l.id}/draw`}>
                          <Button variant="gold" size="sm">Start Draw</Button>
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
                No lotteries yet. Use the form to create your first one.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminShell>
  );
}