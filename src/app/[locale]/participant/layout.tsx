import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getLocaleFromValue, localizePath } from "@/i18n/config";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ParticipantLayout({ children, params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);

  const profile = await getProfile();
  if (!profile) redirect(localizePath(locale, "/auth/login"));
  if (profile.role !== "participant") redirect(localizePath(locale, "/admin"));

  return <>{children}</>;
}