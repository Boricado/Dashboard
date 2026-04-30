// Browsers cap persistent cookies at roughly 400 days. Supabase refresh tokens
// use this cookie to renew short-lived access tokens without asking to log in.
export const SUPABASE_SESSION_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

export const supabaseSessionCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: SUPABASE_SESSION_MAX_AGE_SECONDS,
};

export const supabaseBrowserAuthOptions = {
  flowType: "pkce" as const,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  persistSession: true,
};

export const supabaseServerAuthOptions = {
  flowType: "pkce" as const,
  autoRefreshToken: false,
  detectSessionInUrl: false,
  persistSession: true,
};
