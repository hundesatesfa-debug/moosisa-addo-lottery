import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/auth/login");
  if (profile.role !== "admin" && profile.role !== "super_admin") {
    redirect("/participant");
  }
  return <>{children}</>;
}