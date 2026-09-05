import Link from "next/link";
import { AuthShell, AuthForm } from "@/components/auth/AuthShell";
import { signupAction } from "@/app/actions/auth";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Register for free and claim your chance to win"
    >
      <AuthForm
        action={signupAction}
        submitLabel="Create Account"
        fields={[
          {
            name: "full_name",
            label: "Full Name",
            placeholder: "Abebe Kebede",
            autoComplete: "name",
            required: true,
          },
          {
            name: "phone",
            label: "Phone Number",
            type: "tel",
            placeholder: "+251 9XX XXX XXX",
            autoComplete: "tel",
            required: true,
          },
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
            placeholder: "Minimum 8 characters",
            autoComplete: "new-password",
            required: true,
          },
        ]}
        footer={
          <p className="text-slate-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-brand-600 hover:underline">
              Log in
            </Link>
          </p>
        }
      />
    </AuthShell>
  );
}