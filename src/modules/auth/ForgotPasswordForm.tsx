"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { hasSupabaseEnv } from "@/lib/env";

export function ForgotPasswordForm() {
  const isConfigured = hasSupabaseEnv();
  const supabase = useMemo(
    () => (isConfigured ? createSupabaseBrowserClient() : null),
    [isConfigured],
  );

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Configura Supabase antes de recuperar la contraseña.");
      }

      const origin = window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/actualizar-clave")}`,
        },
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess("Te enviamos un correo para restablecer la contraseña.");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "No se pudo enviar el correo.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="app-card p-6 sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)]">
          Recuperar contraseña
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Ingresa tu correo y te enviaremos un enlace para cambiar la clave.
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
            <span className="text-sm font-medium text-[var(--ink)]">Email</span>
            <input
              className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isConfigured || !email || loading}
            className="mt-2 h-11 rounded-2xl bg-[var(--ink)] text-sm font-medium text-[var(--surface-strong)] disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar correo"}
          </button>

          <Link href="/login" className="text-sm text-[var(--muted)] underline">
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}
