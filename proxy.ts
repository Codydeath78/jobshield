import {
  updateSession,
} from "@/lib/supabase/proxy";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

export async function proxy(
  request:
    NextRequest,
) {
  const pathname =
    request.nextUrl.pathname;

/*These endpoints authenticate themselves and must be reachable before a normal JobShield browser session exists. */
  if (
  pathname ===
    "/api/extension/analyze" ||
  pathname ===
    "/api/auth/confirm-signup" ||
  pathname ===
    "/auth/recovery"
) {
  return NextResponse.next();
}


  return await updateSession(
    request,
  );
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - static image files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};