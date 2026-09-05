import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/dashboard/AdminShell";
import { DrawExperience, type WinnersData } from "@/components/dashboard/DrawExperience";
import { Card, CardContent } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Start Secure Draw" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DrawLotteryPage({ params }: Props) {
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

  // Eligible = verified tickets only (mirrors server logic).
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id")
    .eq("lottery_id", lottery.id)
    .eq("payment_status", "verified");
  const eligible = tickets?.length ?? 0;

  const { data: winners } = await supabase
    .from("winners")
    .select("*")
    .eq("lottery_id", lottery.id)
    .order("position");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name");
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const { data: allTickets } = await supabase
    .from("tickets")
    .select("id, ticket_code");
  const ticketMap = new Map((allTickets ?? []).map((t) => [t.id, t.ticket_code]));

  const initialWinners: WinnersData[] = (winners ?? []).map((w) => ({
    position: w.position,
    user_id: w.user_id,
    ticket_id: w.ticket_id,
    ticket_code: ticketMap.get(w.ticket_id) ?? "",
    full_name: profileMap.get(w.user_id) ?? null,
  }));

  const drawable =
    lottery.status === "closed" ||
    lottery.status === "active" ||
    lottery.status === "drawing";
  const alreadyDrawn = lottery.status === "completed";

  return (
    <AdminShell name={profile.full_name ?? "Admin"} role={profile.role}>
      <div className="mx-auto max-w-3xl">
        {alreadyDrawn ? (
          <DrawExperience
            lottery={{ id: lottery.id, title: lottery.title }}
            eligible={eligible}
            initialWinners={initialWinners}
          />
        ) : drawable ? (
          <DrawExperience
            lottery={{ id: lottery.id, title: lottery.title }}
            eligible={eligible}
            initialWinners={[]}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-lg font-bold text-slate-900">Draw not available</h2>
              <p className="mt-2 text-sm text-slate-500">
                This lottery is currently &quot;{lottery.status}&quot;. Close
                registration before starting a draw.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}