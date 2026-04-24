"use client";

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
  const [loading, setLoading] = useState<null | "email" | "github">(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWithEmail() {
    setError(null);
    setLoading("email");

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
      const message =
        caughtError instanceof Error ? caughtError.message : "Error desconocido";
      setError(message);
    } finally {
      setLoading(null);
    }
  }

  async function signInWithGithub() {
    setError(null);
    setLoading("github");

    try {
      if (!supabase) {
        throw new Error("Configura Supabase antes de iniciar sesión.");
      }

      const origin = window.location.origin;
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }

      if (data.url) {
        window.location.assign(data.url);
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Error desconocido";
      setError(message);
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-16">
      <span className="inline-flex w-fit rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
        Acceso
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
      <p className="text-sm leading-6 text-[var(--muted)]">
        Entra con correo y clave o usando GitHub.
      </p>

      {!isConfigured ? (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          Primero configura las variables de Supabase en{" "}
          <code className="rounded bg-black/10 px-1 py-0.5 text-[12px]">
            .env.local
          </code>
          .
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-3 text-sm text-red-950">
          {error}
        </div>
      ) : null}

      <div className="app-card p-4">
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Email</span>
            <input
              className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Clave</span>
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
            disabled={!isConfigured || !email || !password || loading !== null}
            className="h-11 rounded-2xl bg-[var(--ink)] text-sm font-medium text-[var(--surface-strong)] disabled:opacity-50"
          >
            {loading === "email" ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>

      <div className="app-card p-4">
        <button
          onClick={signInWithGithub}
          disabled={!isConfigured || loading !== null}
          className="h-11 w-full rounded-2xl border border-[var(--line)] bg-white text-sm font-medium hover:bg-[var(--surface-strong)] disabled:opacity-50"
        >
          {loading === "github" ? "Abriendo GitHub..." : "Entrar con GitHub"}
        </button>
      </div>
    </div>
  );
}
