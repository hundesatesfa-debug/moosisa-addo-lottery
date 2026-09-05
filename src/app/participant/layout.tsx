import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/auth/login");
  if (profile.role !== "participant") redirect("/admin");

  return <>{children}</>;
}