"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const isConfigured = hasSupabaseEnv();
  const supabase = useMemo(
    () => (isConfigured ? createSupabaseBrowserClient() : null),
    [isConfigured],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getFriendlyAuthMessage(message: string) {
    if (message.includes("Email not confirmed")) {
      return "Tu correo todavía no está confirmado. Revisa tu bandeja o desactiva la confirmación por email en Supabase Auth.";
    }

    if (message.includes("email_not_confirmed")) {
      return "Tu correo todavía no está confirmado. Revisa tu bandeja o desactiva la confirmación por email en Supabase Auth.";
    }

    if (message.includes("Invalid login credentials")) {
      return "Correo o clave incorrectos.";
    }

    return message;
  }

  async function signInWithEmail() {
    setError(null);
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Configura Supabase antes de iniciar sesión.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Error desconocido";
      setError(getFriendlyAuthMessage(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="app-card p-6 sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)]">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Inicia sesión para continuar.</p>

        {!isConfigured ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Faltan variables de Supabase en Vercel.
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-[var(--ink)]">Email</span>
            <input
              className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-[var(--ink)]">Clave</span>
            <input
              className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
            />
          </label>

          <button
            onClick={signInWithEmail}
            disabled={!isConfigured || !email || !password || loading}
            className="mt-2 h-11 rounded-2xl bg-[var(--ink)] text-sm font-medium text-[var(--surface-strong)] disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <Link
            href="/recuperar-clave"
            className="text-sm text-[var(--muted)] underline"
          >
            Recuperar contraseña
          </Link>
        </div>
      </div>
    </div>
  );
}
