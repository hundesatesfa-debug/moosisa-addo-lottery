"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/audit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?[0-9 ]{9,15})$/;

export interface AuthState {
  error?: string;
}

function validateSignup(data: FormData) {
  const fullName = (data.get("full_name") as string)?.trim();
  const phone = (data.get("phone") as string)?.trim();
  const email = (data.get("email") as string)?.trim();
  const password = (data.get("password") as string) ?? "";

  if (!fullName || fullName.length < 2) return { error: "Please enter your full name." };
  if (!phone || !PHONE_RE.test(phone)) return { error: "Please enter a valid phone number." };
  if (!email || !EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  return { fullName, phone, email, password };
}

export async function signupAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const v = validateSignup(formData);
  if ("error" in v) return v;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: {
      data: {
        full_name: v.fullName,
        phone: v.phone,
        role: "participant",
      },
    },
  });

  if (error) {
    return { error: "error" in error && error.message ? error.message : "Sign up failed." };
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
    redirect("/participant");
  }

  return { error: "Check your email to confirm your account, then log in." };
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: "Invalid email or password." };

  // Server-side role check; never trust the client.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_status")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role ?? "participant";

  if (profile?.account_status === "suspended") {
    await supabase.auth.signOut();
    return { error: "This account has been suspended. Contact support." };
  }

  redirect(role === "admin" || role === "super_admin" ? "/admin" : "/participant");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resetPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  if (!email || !EMAIL_RE.test(email)) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/update-password`,
  });
  if (error) return { error: error.message };
  return {
    error: "If an account exists for that email, a reset link has been sent.",
  };
}

export async function updatePasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const password = (formData.get("password") as string) ?? "";
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/participant");
}