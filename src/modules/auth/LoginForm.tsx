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
      return "Tu correo todavia no esta confirmado. Revisa tu bandeja o desactiva la confirmacion por email en Supabase Auth.";
    }

    if (message.includes("email_not_confirmed")) {
      return "Tu correo todavia no esta confirmado. Revisa tu bandeja o desactiva la confirmacion por email en Supabase Auth.";
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
        throw new Error("Configura Supabase antes de iniciar sesion.");
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
    <div className="app-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="app-shell-surface rounded-[2rem] px-6 py-8 sm:px-8 lg:px-10">
          <span className="rounded-full border border-emerald-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Acceso principal
          </span>
          <h1 className="app-display mt-5 text-5xl leading-none font-semibold text-[var(--ink)] sm:text-6xl">
            Entra al centro de mando.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">
            Licitaciones, proyectos, salud y operacion diaria en una sola interfaz mas clara y
            mantenible.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="app-card p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Arquitectura</p>
              <p className="mt-3 text-sm leading-6 text-[var(--ink)]">
                Modulos separados, contexto por dominio y menos arrastre tecnico.
              </p>
            </div>
            <div className="app-card p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Uso diario</p>
              <p className="mt-3 text-sm leading-6 text-[var(--ink)]">
                Optimizado para escritorio y con navegacion mas comoda desde movil.
              </p>
            </div>
          </div>
        </section>

        <div className="app-card p-6 sm:p-8">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--ink)]">Dashboard</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Inicia sesion para continuar.</p>

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
                className="h-12 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-[var(--ink)]">Clave</span>
              <input
                className="h-12 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm outline-none focus:border-[var(--accent)]"
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
              className="mt-2 h-12 rounded-2xl bg-[var(--ink)] text-sm font-medium text-[var(--sand)] disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <Link href="/recuperar-clave" className="text-sm text-[var(--muted)] underline">
              Recuperar contrasena
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
