import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession(await headers());

  return (
    <DashboardShell session={session}>
      {children}
    </DashboardShell>
  );
}
