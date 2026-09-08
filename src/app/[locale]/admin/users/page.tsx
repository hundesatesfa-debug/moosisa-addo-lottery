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
import {
  getDictionary,
  getLocaleFromValue,
  t,
} from "@/i18n/config";

const roleBadgeClass: Record<UserRole, string> = {
  participant: "bg-slate-100 text-slate-700",
  admin: "bg-brand-50 text-brand-700",
  super_admin: "bg-gold-50 text-gold-600",
};

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const dict = getDictionary(getLocaleFromValue(rawLocale));
  return { title: dict.admin.titles.users };
}

export default async function AdminUsersPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);
  const dict = getDictionary(locale);

  const profile = await getProfile();
  if (profile?.role !== "super_admin") return null;

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const roleName: Record<UserRole, string> = {
    participant: dict.admin.roleParticipant,
    admin: dict.admin.roleAdmin,
    super_admin: dict.admin.roleSuperAdmin,
  };

  return (
    <AdminShell name={profile.full_name ?? dict.common.superAdmin} role={profile.role}>
      {profiles && profiles.length > 0 ? (
        <div className="space-y-3">
          {profiles.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">
                      {u.full_name ?? dict.admin.unnamed}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${roleBadgeClass[u.role as UserRole]}`}>
                      {roleName[u.role as UserRole]}
                    </span>
                    {u.id === profile.id && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                        {dict.common.you}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {u.phone ?? dict.common.noPhone} · {t(dict.admin.sinceLabel, { date: formatDate(u.created_at) })}
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
                          {u.account_status === "suspended" ? dict.admin.reactivate : dict.admin.suspend}
                        </Button>
                      </form>
                      <form action={setUserRoleAction}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <Select name="role" defaultValue={u.role} className="h-9 w-36 text-xs" disabled={u.id === profile.id}>
                          <option value="participant">{dict.admin.roleParticipant}</option>
                          <option value="admin">{dict.admin.roleAdmin}</option>
                          <option value="super_admin">{dict.admin.roleSuperAdmin}</option>
                        </Select>
                        <Button type="submit" variant="outline" size="sm" className="ml-2">
                          {dict.admin.setRole}
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
        <EmptyState icon={Users} title={dict.admin.noUsersTitle} />
      )}
    </AdminShell>
  );
}