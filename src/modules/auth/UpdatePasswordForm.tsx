"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function UpdatePasswordForm() {
  const router = useRouter();
  const isConfigured = hasSupabaseEnv();
  const supabase = useMemo(
    () => (isConfigured ? createSupabaseBrowserClient() : null),
    [isConfigured],
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("La nueva clave debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las claves no coinciden.");
      return;
    }

    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Configura Supabase antes de actualizar la contraseña.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess("Tu contraseña fue actualizada. Redirigiendo al inicio...");
      window.setTimeout(() => {
        router.replace("/inicio");
        router.refresh();
      }, 1200);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "No se pudo actualizar la contraseña.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="app-card p-6 sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)]">
          Nueva contraseña
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Ingresa tu nueva clave para continuar.
        </p>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            {success}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-[var(--ink)]">Nueva clave</span>
            <input
              className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-[var(--ink)]">Confirmar clave</span>
            <input
              className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
            />
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isConfigured || !password || !confirmPassword || loading}
            className="mt-2 h-11 rounded-2xl bg-[var(--ink)] text-sm font-medium text-[var(--surface-strong)] disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Actualizar contraseña"}
          </button>

          <Link href="/login" className="text-sm text-[var(--muted)] underline">
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}
