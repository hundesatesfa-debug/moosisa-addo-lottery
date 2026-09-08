import Link from "next/link";
import { AuthShell, AuthForm } from "@/components/auth/AuthShell";
import { signupAction } from "@/app/actions/auth";
import { getDictionary, getLocaleFromValue, localizePath } from "@/i18n/config";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SignupPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);
  const dict = getDictionary(locale);

  const placeholder = {
    name: dict.auth.namePlaceholder,
  };

  return (
    <AuthShell
      title={dict.auth.createYourAccount}
      subtitle={dict.auth.signupSubtitle}
    >
      <AuthForm
        action={signupAction}
        submitLabel={dict.auth.createAccountBtn}
        fields={[
          {
            name: "full_name",
            label: dict.auth.fullName,
            placeholder: placeholder.name,
            autoComplete: "name",
            required: true,
          },
          {
            name: "phone",
            label: dict.auth.phoneNumber,
            type: "tel",
            placeholder: dict.auth.phonePlaceholder,
            autoComplete: "tel",
            required: true,
          },
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
            placeholder: dict.auth.min8,
            autoComplete: "new-password",
            required: true,
          },
        ]}
        footer={
          <p className="text-slate-500">
            {dict.auth.alreadyHaveAccount}{" "}
            <Link href={localizePath(locale, "/auth/login")} className="font-medium text-brand-600 hover:underline">
              {dict.auth.logIn}
            </Link>
          </p>
        }
      />
    </AuthShell>
  );
}