import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabase.url(), env.supabase.anonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  if (pathname === "/inicio") {
    const saludUrl = request.nextUrl.clone();
    saludUrl.pathname = "/salud";
    saludUrl.search = "";
    return NextResponse.redirect(saludUrl);
  }

  const isDashboard =
    pathname.startsWith("/licitaciones") ||
    pathname.startsWith("/tareas") ||
    pathname.startsWith("/salud") ||
    pathname.startsWith("/proyectos") ||
    pathname.startsWith("/muebles") ||
    pathname.startsWith("/banco") ||
    pathname.startsWith("/contador");

  if (isDashboard && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
