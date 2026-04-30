import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import {
  supabaseBrowserAuthOptions,
  supabaseSessionCookieOptions,
} from "@/lib/supabase/session";

export function createSupabaseBrowserClient() {
  return createBrowserClient(env.supabase.url(), env.supabase.anonKey(), {
    auth: supabaseBrowserAuthOptions,
    cookieOptions: supabaseSessionCookieOptions,
  });
}

