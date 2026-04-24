const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }

  return value;
}

export function hasSupabaseEnv() {
  return Boolean(publicSupabaseUrl && publicSupabaseAnonKey);
}

export const env = {
  supabase: {
    url: () =>
      required(publicSupabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: () =>
      required(publicSupabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  },
  site: {
    url: () => required(publicSiteUrl, "NEXT_PUBLIC_SITE_URL"),
  },
};
