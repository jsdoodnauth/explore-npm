import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { auth } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { changePasswordSchema, parseBodyNext } from "@/lib/schemas";

// POST /api/user/password
// Body: { currentPassword: string; newPassword: string }
// Rate limit: 5 attempts per 15 minutes per user (brute-force protection)
export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireSession(await headers());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`password:${session.user.id}`, 5, 15 * 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseBodyNext(changePasswordSchema, rawBody);
  if (!parsed.success) return parsed.response;
  const { currentPassword, newPassword } = parsed.data;

  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: { currentPassword, newPassword, revokeOtherSessions: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Password change failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
