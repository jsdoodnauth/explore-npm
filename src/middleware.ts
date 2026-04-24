import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const session = await auth.api.getSession({ headers: request.headers });
  const isAuthed = !!session;
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  // Admin routes — redirect non-admins (including unauthenticated) to /dashboard
  if (pathname.startsWith("/admin")) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Protected routes — redirect unauthenticated to /sign-in
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthed) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  // Auth pages — redirect already-authenticated users to /dashboard
  if (pathname === "/sign-in" || pathname === "/sign-up") {
    if (isAuthed) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/sign-in", "/sign-up"],
};
