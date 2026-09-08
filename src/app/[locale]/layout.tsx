import type { Metadata } from "next";
import { LocaleProvider } from "@/i18n/client";
import { getDictionary, getLocaleFromValue } from "@/i18n/config";
import { ToastProvider } from "@/components/ui/Toast";
import "../globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);
  const dict = getDictionary(locale);
  return {
    title: {
      default: dict.meta.defaultTitle,
      template: dict.meta.titleTemplate,
    },
    description: dict.meta.description,
    keywords: dict.meta.keywords,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "https://moosisa-addo-lottery.vercel.app",
    ),
    openGraph: {
      title: dict.meta.defaultTitle,
      description: dict.meta.description,
      siteName: "Mosisaa Addunyaa Abbaa Carraa",
    },
  };
}

export default async function RootLayout({ children, params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);
  const dict = getDictionary(locale);

  return (
    <html lang={locale}>
      <body>
        <LocaleProvider locale={locale} dict={dict}>
          <ToastProvider>{children}</ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}