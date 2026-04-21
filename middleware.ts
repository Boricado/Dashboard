import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/inicio/:path*",
    "/licitaciones/:path*",
    "/tareas/:path*",
    "/salud/:path*",
    "/proyectos/:path*",
    "/muebles/:path*",
    "/banco/:path*",
    "/contador/:path*",
    "/perfil/:path*",
  ],
};
