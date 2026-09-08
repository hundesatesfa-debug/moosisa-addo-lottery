import Link from "next/link";
import { AuthShell, AuthForm } from "@/components/auth/AuthShell";
import { resetPasswordAction } from "@/app/actions/auth";
import { getDictionary, getLocaleFromValue, localizePath } from "@/i18n/config";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);
  const dict = getDictionary(locale);

  return (
    <AuthShell title={dict.auth.resetTitle} subtitle={dict.auth.resetSubtitle}>
      <AuthForm
        action={resetPasswordAction}
        submitLabel={dict.auth.sendResetLink}
        fields={[
          {
            name: "email",
            label: dict.auth.email,
            type: "email",
            placeholder: dict.auth.emailPlaceholder,
            autoComplete: "email",
            required: true,
          },
        ]}
        footer={
          <p className="text-slate-500">
            {dict.auth.rememberPassword}{" "}
            <Link href={localizePath(locale, "/auth/login")} className="font-medium text-brand-600 hover:underline">
              {dict.auth.backToLogin}
            </Link>
          </p>
        }
      />
    </AuthShell>
  );
}