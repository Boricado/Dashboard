import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import {
  supabaseServerAuthOptions,
  supabaseSessionCookieOptions,
} from "@/lib/supabase/session";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabase.url(), env.supabase.anonKey(), {
    auth: supabaseServerAuthOptions,
    cookieOptions: supabaseSessionCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // En Server Components, setear cookies puede no estar permitido.
          // Los refresh de sesión deberían ocurrir en middleware o route handlers.
        }
      },
    },
  });
}
