import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/dashboard/AdminShell";
import { updateLotteryAction } from "@/app/actions/lottery";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label, Input, Textarea } from "@/components/ui/Field";

export const metadata: Metadata = { title: "Edit Lottery" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditLotteryPage({ params }: Props) {
  const { id } = await params;
  const profile = await getProfile();
  const supabase = await createClient();
  if (!profile) return null;

  const { data: lottery } = await supabase
    .from("lotteries")
    .select("*")
    .eq("id", id)
    .single();

  if (!lottery) notFound();

  const editable = lottery.status !== "completed";

  const toLocal = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <AdminShell name={profile.full_name ?? "Admin"} role={profile.role}>
      <Card className="mx-auto max-w-2xl">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-slate-900">Edit Lottery</h2>
          {!editable && (
            <p className="mt-2 text-sm font-medium text-red-600">
              This lottery is completed and can no longer be edited.
            </p>
          )}
          <form action={updateLotteryAction} className="mt-4 space-y-4">
            <input type="hidden" name="id" value={lottery.id} />
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={lottery.title} required disabled={!editable} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} defaultValue={lottery.description ?? ""} disabled={!editable} />
            </div>
            <div>
              <Label htmlFor="ticket_price">Ticket Price (ETB)</Label>
              <Input id="ticket_price" name="ticket_price" type="number" defaultValue={Number(lottery.ticket_price)} min={1} disabled={!editable} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="registration_start">Reg. Start</Label>
                <Input id="registration_start" name="registration_start" type="datetime-local" defaultValue={toLocal(lottery.registration_start)} disabled={!editable} />
              </div>
              <div>
                <Label htmlFor="registration_end">Reg. Close</Label>
                <Input id="registration_end" name="registration_end" type="datetime-local" defaultValue={toLocal(lottery.registration_end)} disabled={!editable} />
              </div>
            </div>
            <div>
              <Label htmlFor="draw_date">Draw Date</Label>
              <Input id="draw_date" name="draw_date" type="datetime-local" defaultValue={toLocal(lottery.draw_date)} disabled={!editable} />
            </div>
            {editable && (
              <Button type="submit" className="w-full">Save Changes</Button>
            )}
          </form>
        </CardContent>
      </Card>
    </AdminShell>
  );
}