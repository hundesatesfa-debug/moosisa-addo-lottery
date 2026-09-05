import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/dashboard/AdminShell";
import { setUserRoleAction, setUserStatusAction } from "@/app/actions/admin";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

const roleBadgeClass: Record<UserRole, string> = {
  participant: "bg-slate-100 text-slate-700",
  admin: "bg-brand-50 text-brand-700",
  super_admin: "bg-gold-50 text-gold-600",
};

export const metadata: Metadata = { title: "Manage Users" };

export default async function AdminUsersPage() {
  const profile = await getProfile();
  if (profile?.role !== "super_admin") return null;

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AdminShell name={profile.full_name ?? "Super Admin"} role={profile.role}>
      {profiles && profiles.length > 0 ? (
        <div className="space-y-3">
          {profiles.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">
                      {u.full_name ?? "Unnamed"}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${roleBadgeClass[u.role as UserRole]}`}>
                      {u.role === "super_admin" ? "Super Admin" : u.role}
                    </span>
                    {u.id === profile.id && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                        You
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {u.phone ?? "no phone"} · since {formatDate(u.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {u.id !== profile.id && (
                    <>
                      <form action={setUserStatusAction}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={u.account_status === "suspended" ? "active" : "suspended"}
                        />
                        <Button
                          variant={u.account_status === "suspended" ? "success" : "danger"}
                          size="sm"
                        >
                          {u.account_status === "suspended" ? "Reactivate" : "Suspend"}
                        </Button>
                      </form>
                      <form action={setUserRoleAction}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <Select name="role" defaultValue={u.role} className="h-9 w-36 text-xs" disabled={u.id === profile.id}>
                          <option value="participant">Participant</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </Select>
                        <Button type="submit" variant="outline" size="sm" className="ml-2">
                          Set
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Users} title="No users yet" />
      )}
    </AdminShell>
  );
}