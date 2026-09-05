import type { Metadata } from "next";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/dashboard/AdminShell";
import { Card, CardContent } from "@/components/ui/Card";
import { LotteryStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Ticket,
  CheckCircle2,
  Clock,
  Dices,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  const profile = await getProfile();
  if (!profile) return null;

  const admin = await createClient();

  const [{ data: stats }, { data: lotteries }] = await Promise.all([
    admin
      .rpc("admin_stats")
      .then((r) => ({ data: r.data as Record<string, number> | null })),
    admin
      .from("lotteries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const statCards = [
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, color: "text-brand-600 bg-brand-50" },
    { label: "Total Tickets", value: stats?.total_tickets ?? 0, icon: Ticket, color: "text-violet-600 bg-violet-50" },
    { label: "Verified Tickets", value: stats?.verified_tickets ?? 0, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    { label: "Pending Payments", value: stats?.pending_payments ?? 0, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Active Lotteries", value: stats?.active_lotteries ?? 0, icon: Dices, color: "text-sky-600 bg-sky-50" },
    { label: "Completed", value: stats?.completed_lotteries ?? 0, icon: Trophy, color: "text-gold-600 bg-gold-50" },
  ];

  return (
    <AdminShell name={profile.full_name ?? "Admin"} role={profile.role}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-2xl font-extrabold text-slate-900">{s.value}</p>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Lotteries</h2>
          <Link href="/admin/lotteries">
            <Button variant="outline" size="sm">
              Manage <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {lotteries && lotteries.length > 0 ? (
          <div className="space-y-3">
            {lotteries.map((l) => (
              <Card key={l.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <p className="font-bold text-slate-900">{l.title}</p>
                    <p className="text-xs text-slate-400">
                      {formatDate(l.registration_start)} → {formatDate(l.draw_date)} · {l.ticket_price} ETB
                    </p>
                  </div>
                  <LotteryStatusBadge status={l.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-slate-500">
              No lotteries yet. Create your first one.
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}