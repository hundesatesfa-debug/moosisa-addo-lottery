import Link from "next/link";
import { AuthShell, AuthForm } from "@/components/auth/AuthShell";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to your account">
      <AuthForm
        action={loginAction}
        submitLabel="Log In"
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "you@example.com",
            autoComplete: "email",
            required: true,
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            placeholder: "••••••••",
            autoComplete: "current-password",
            required: true,
          },
        ]}
        footer={
          <>
            <Link href="/auth/forgot" className="font-medium text-brand-600 hover:underline">
              Forgot password?
            </Link>
            <p className="text-slate-500">
              New here?{" "}
              <Link href="/auth/signup" className="font-medium text-brand-600 hover:underline">
                Create an account
              </Link>
            </p>
          </>
        }
      />
    </AuthShell>
  );
}