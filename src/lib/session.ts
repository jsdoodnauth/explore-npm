import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Session } from "@/lib/auth";

export async function getSession(headers: Headers): Promise<Session | null> {
  return auth.api.getSession({ headers });
}

export async function requireSession(headers: Headers): Promise<Session> {
  const session = await getSession(headers);
  if (!session) redirect("/sign-in");
  return session;
}

export async function requireAdmin(headers: Headers): Promise<Session> {
  const session = await requireSession(headers);
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") redirect("/dashboard");
  return session;
}
