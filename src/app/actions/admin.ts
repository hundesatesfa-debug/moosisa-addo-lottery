"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/audit";
import { getServerDict, localizedPath } from "@/i18n/server";
import type { UserRole } from "@/lib/types";

// All actions in this file are super_admin only — enforced server-side.

export async function setUserRoleAction(formData: FormData) {
  const profile = await getProfile();
  const { dict } = await getServerDict();
  if (!profile || profile.role !== "super_admin") throw new Error("FORBIDDEN");

  const userId = String(formData.get("user_id"));
  const role = String(formData.get("role")) as UserRole;
  if (!["participant", "admin", "super_admin"].includes(role)) {
    throw new Error(dict.errors.invalidRole);
  }
  if (userId === profile.id) throw new Error(dict.errors.cannotChangeOwnRole);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  await createAuditLog({
    actorId: profile.id,
    action: "user.role_changed",
    entityType: "user",
    entityId: userId,
    metadata: { role },
  });

  revalidatePath(await localizedPath("/admin/users"));
}

export async function setUserStatusAction(formData: FormData) {
  const profile = await getProfile();
  const { dict } = await getServerDict();
  if (!profile || profile.role !== "super_admin") throw new Error("FORBIDDEN");

  const userId = String(formData.get("user_id"));
  const status = String(formData.get("status"));
  if (!["active", "suspended"].includes(status)) throw new Error(dict.errors.invalidStatus);
  if (userId === profile.id) throw new Error(dict.errors.cannotSuspendSelf);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ account_status: status })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  await createAuditLog({
    actorId: profile.id,
    action: status === "suspended" ? "user.suspended" : "user.reactivated",
    entityType: "user",
    entityId: userId,
  });

  // Best-effort ban at the auth level (needs service role key). Suspended
  // profiles are already blocked by RLS + login checks even without this.
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      await createAdminClient().auth.admin.updateUserById(userId, {
        ban_duration: status === "suspended" ? "876000h" : "none",
      });
    } catch (e) {
      console.error("Could not update auth ban:", (e as Error).message);
    }
  }

  revalidatePath(await localizedPath("/admin/users"));
}