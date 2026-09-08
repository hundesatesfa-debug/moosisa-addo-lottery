import { AuthShell, AuthForm } from "@/components/auth/AuthShell";
import { updatePasswordAction } from "@/app/actions/auth";
import { getDictionary, getLocaleFromValue } from "@/i18n/config";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function UpdatePasswordPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);
  const dict = getDictionary(locale);

  return (
    <AuthShell
      title={dict.auth.updatePasswordTitle}
      subtitle={dict.auth.updatePasswordSubtitle}
    >
      <AuthForm
        action={updatePasswordAction}
        submitLabel={dict.auth.updatePasswordBtn}
        fields={[
          {
            name: "password",
            label: dict.auth.newPassword,
            type: "password",
            placeholder: dict.auth.min8,
            autoComplete: "new-password",
            required: true,
          },
        ]}
      />
    </AuthShell>
  );
}