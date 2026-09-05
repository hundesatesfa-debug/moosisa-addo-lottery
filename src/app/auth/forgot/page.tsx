import Link from "next/link";
import { AuthShell, AuthForm } from "@/components/auth/AuthShell";
import { resetPasswordAction } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a reset link">
      <AuthForm
        action={resetPasswordAction}
        submitLabel="Send Reset Link"
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "you@example.com",
            autoComplete: "email",
            required: true,
          },
        ]}
        footer={
          <p className="text-slate-500">
            Remembered it?{" "}
            <Link href="/auth/login" className="font-medium text-brand-600 hover:underline">
              Back to log in
            </Link>
          </p>
        }
      />
    </AuthShell>
  );
}