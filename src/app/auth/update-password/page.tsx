import { AuthShell, AuthForm } from "@/components/auth/AuthShell";
import { updatePasswordAction } from "@/app/actions/auth";

export default function UpdatePasswordPage() {
  return (
    <AuthShell title="Set a new password" subtitle="Enter your new password">
      <AuthForm
        action={updatePasswordAction}
        submitLabel="Update Password"
        fields={[
          {
            name: "password",
            label: "New Password",
            type: "password",
            placeholder: "Minimum 8 characters",
            autoComplete: "new-password",
            required: true,
          },
        ]}
      />
    </AuthShell>
  );
}