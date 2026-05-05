import { NextResponse, type NextRequest } from "next/server";

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => {
    if (!cookie.value) {
      return false;
    }

    return /^sb-[a-z0-9]+-auth-token(?:\.\d+)?$/i.test(cookie.name);
  });
}

export function updateSession(request: NextRequest) {
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
    pathname.startsWith("/contador") ||
    pathname.startsWith("/perfil");

  if (isDashboard && !hasSupabaseSessionCookie(request)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request });
}
