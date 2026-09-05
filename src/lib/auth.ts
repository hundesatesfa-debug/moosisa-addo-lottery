import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { UserRole, Profile } from "@/lib/types";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!data || data.account_status !== "active") return null;
  return data as Profile;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

export async function requireParticipant(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) {
    throw new Error("UNAUTHORIZED");
  }
  return profile;
}

const ADMIN_ROLES: UserRole[] = ["admin", "super_admin"];

export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    throw new Error("FORBIDDEN");
  }
  return profile;
}

export async function requireSuperAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || profile.role !== "super_admin") {
    throw new Error("FORBIDDEN");
  }
  return profile;
}

// Role is always resolved from the server via RLS-secured profiles table.
// Frontend role values are never trusted.
export function canAccessAdmin(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}
