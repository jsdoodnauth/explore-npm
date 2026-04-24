import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { auth } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { updateProfileSchema, parseBodyNext } from "@/lib/schemas";

// PATCH /api/user/profile
// Body: { name?: string; image?: string | null }
// Rate limit: 10 updates per minute per user
export async function PATCH(request: NextRequest) {
  let session;
  try {
    session = await requireSession(await headers());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`profile:${session.user.id}`, 10, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseBodyNext(updateProfileSchema, rawBody);
  if (!parsed.success) return parsed.response;
  const { name, image } = parsed.data;

  try {
    await auth.api.updateUser({
      headers: await headers(),
      body: {
        ...(name !== undefined ? { name } : {}),
        ...(image !== undefined ? { image } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
