import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/dashboard/AdminShell";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScrollText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Activity & Audit Logs" };

export default async function AdminActivityPage() {
  const profile = await getProfile();
  if (profile?.role !== "super_admin") return null;

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, profiles!actor_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AdminShell name={profile.full_name ?? "Super Admin"} role={profile.role}>
      {logs && logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map((log) => {
            const actor = log.profiles as unknown as { full_name?: string } | null;
            return (
              <Card key={log.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <ScrollText className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {log.action}
                      </p>
                      <p className="text-xs text-slate-400">
                        {actor?.full_name ?? "System"} · {log.entity_type} {log.entity_id ? `· ${log.entity_id.slice(0, 8)}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatDateTime(log.created_at)}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ScrollText}
          title="No activity yet"
          description="Audit events will appear here as users and admins take action."
        />
      )}
    </AdminShell>
  );
}