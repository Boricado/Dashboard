import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, hasSupabaseEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/salud";

  const response = NextResponse.redirect(new URL(next, url.origin));

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(next)}`, url.origin),
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/configuracion", url.origin));
  }

  const supabase = createServerClient(env.supabase.url(), env.supabase.anonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(next)}`, url.origin),
    );
  }

  return response;
}
