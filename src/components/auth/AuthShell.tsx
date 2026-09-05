"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import type { AuthState } from "@/app/actions/auth";

type Action = (
  prev: AuthState,
  formData: FormData,
) => Promise<AuthState>;

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-brand-950 to-slate-900">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8">
            <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
            <div className="mt-6">{children}</div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">
            Protected by industry-standard security. 18+ only.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthForm({
  action,
  submitLabel,
  fields,
  footer,
}: {
  action: Action;
  submitLabel: string;
  fields: Array<{
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    autoComplete?: string;
    required?: boolean;
  }>;
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {fields.map((f) => (
        <div key={f.name}>
          <Label htmlFor={f.name}>{f.label}</Label>
          <Input
            id={f.name}
            name={f.name}
            type={f.type ?? "text"}
            placeholder={f.placeholder}
            autoComplete={f.autoComplete}
            required={f.required}
          />
        </div>
      ))}

      {state?.error && (
        <div
          role="alert"
          className={cn(
            "rounded-xl px-4 py-3 text-sm font-medium",
            state.error.includes("Check your email")
              ? "bg-sky-50 text-sky-700"
              : "bg-red-50 text-red-700",
          )}
        >
          {state.error}
        </div>
      )}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? <Spinner /> : null}
        {pending ? "Please wait..." : submitLabel}
      </Button>

      {footer && <div className="mt-4 text-center text-sm">{footer}</div>}
    </form>
  );
}