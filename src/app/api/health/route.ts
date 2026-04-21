import { NextResponse } from "next/server";
import { env, hasSupabaseEnv } from "@/lib/env";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      error: "Missing Supabase environment variables",
    });
  }

  try {
    const url = env.supabase.url();
    const anonKey = env.supabase.anonKey();

    const startedAt = Date.now();
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: {
        apikey: anonKey,
      },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const elapsedMs = Date.now() - startedAt;

    return NextResponse.json({
      ok: true,
      configured: true,
      supabase: {
        ok: res.ok,
        status: res.status,
        elapsedMs,
      },
    });
  } catch (caughtError) {
    const message =
      caughtError instanceof Error ? caughtError.message : "Unknown error";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
