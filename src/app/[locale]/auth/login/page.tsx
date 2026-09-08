import Link from "next/link";
import { AuthShell, AuthForm } from "@/components/auth/AuthShell";
import { loginAction } from "@/app/actions/auth";
import { getDictionary, getLocaleFromValue, localizePath } from "@/i18n/config";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);
  const dict = getDictionary(locale);

  return (
    <AuthShell title={dict.auth.welcomeBack} subtitle={dict.auth.loginSubtitle}>
      <AuthForm
        action={loginAction}
        submitLabel={dict.auth.logIn}
        fields={[
          {
            name: "email",
            label: dict.auth.email,
            type: "email",
            placeholder: dict.auth.emailPlaceholder,
            autoComplete: "email",
            required: true,
          },
          {
            name: "password",
            label: dict.auth.password,
            type: "password",
            placeholder: "••••••••",
            autoComplete: "current-password",
            required: true,
          },
        ]}
        footer={
          <>
            <Link href={localizePath(locale, "/auth/forgot")} className="font-medium text-brand-600 hover:underline">
              {dict.auth.forgotPassword}
            </Link>
            <p className="text-slate-500">
              {dict.auth.newHere}{" "}
              <Link href={localizePath(locale, "/auth/signup")} className="font-medium text-brand-600 hover:underline">
                {dict.auth.createAccount}
              </Link>
            </p>
          </>
        }
      />
    </AuthShell>
  );
}