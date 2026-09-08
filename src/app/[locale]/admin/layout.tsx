import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getLocaleFromValue, localizePath } from "@/i18n/config";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);

  const profile = await getProfile();
  if (!profile) redirect(localizePath(locale, "/auth/login"));
  if (profile.role !== "admin" && profile.role !== "super_admin") {
    redirect(localizePath(locale, "/participant"));
  }
  return <>{children}</>;
}