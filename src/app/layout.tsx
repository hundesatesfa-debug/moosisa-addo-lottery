import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: {
    default: "Mosisaa Addunyaa Abbaa Carraa — Your Chance to Win",
    template: "%s — Mosisaa Addunyaa Abbaa Carraa",
  },
  description:
    "Mosisaa Addunyaa Abbaa Carraa is a transparent Ethiopian digital lottery. Buy your 300 ETB ticket and three winners are selected securely every round.",
  keywords: ["lottery", "Ethiopia", "300 ETB", "Mosisaa Addunyaa Abbaa Carraa"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}