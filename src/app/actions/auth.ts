"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/audit";
import { getServerDict, localizedPath } from "@/i18n/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?[0-9 ]{9,15})$/;

export interface AuthState {
  error?: string;
  variant?: "error" | "info";
}

export async function signupAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const { dict } = await getServerDict();

  const fullName = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string) ?? "";

  if (!fullName || fullName.length < 2) return { error: dict.authErrors.signupInvalidName };
  if (!phone || !PHONE_RE.test(phone)) return { error: dict.authErrors.signupInvalidPhone };
  if (!email || !EMAIL_RE.test(email)) return { error: dict.authErrors.signupInvalidEmail };
  if (password.length < 8) return { error: dict.authErrors.signupShortPassword };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role: "participant",
      },
    },
  });

  if (error) {
    return { error: error.message || dict.authErrors.signupFailed };
  }

  // Only logged-in users can see the dashboard; if email confirmation is
  // disabled, Supabase returns a session immediately.
  if (data.session) {
    await createAuditLog({
      actorId: data.user?.id,
      action: "user.created",
      entityType: "user",
      entityId: data.user?.id,
    });
    redirect(await localizedPath("/participant"));
  }

  return { error: dict.authErrors.checkEmail, variant: "info" };
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const { dict } = await getServerDict();

  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) return { error: dict.authErrors.requiredCredentials };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: dict.authErrors.invalidCredentials };

  // Server-side role check; never trust the client.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_status")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role ?? "participant";

  if (profile?.account_status === "suspended") {
    await supabase.auth.signOut();
    return { error: dict.authErrors.suspended };
  }

  redirect(
    role === "admin" || role === "super_admin"
      ? await localizedPath("/admin")
      : await localizedPath("/participant"),
  );
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(await localizedPath("/"));
}

export async function resetPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const { dict } = await getServerDict();

  const email = (formData.get("email") as string)?.trim();
  if (!email || !EMAIL_RE.test(email)) return { error: dict.authErrors.invalidEmail };

  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/update-password`,
  });
  if (error) return { error: error.message };
  return { error: dict.authErrors.resetLinkSent, variant: "info" };
}

export async function updatePasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const { dict } = await getServerDict();

  const password = (formData.get("password") as string) ?? "";
  if (password.length < 8) return { error: dict.authErrors.signupShortPassword };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect(await localizedPath("/participant"));
}