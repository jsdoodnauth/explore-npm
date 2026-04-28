import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const session = await auth.api.getSession({ headers: request.headers });
  const isAuthed = !!session;

  if (pathname.startsWith("/dashboard")) {
    if (!isAuthed) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  if (pathname === "/sign-in" || pathname === "/sign-up") {
    if (isAuthed) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
