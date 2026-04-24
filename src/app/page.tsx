import Link from "next/link";
import { hasSupabaseEnv } from "@/lib/env";

export default function Home() {
  const isConfigured = hasSupabaseEnv();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-10 px-6 py-16">
      <section className="rounded-[2.5rem] border border-[var(--line)] bg-[var(--panel)] p-8 shadow-[0_24px_100px_rgba(49,46,37,0.08)] backdrop-blur md:p-10">
        <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Dashboard
        </span>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--ink)] md:text-6xl">
          Una base limpia para que el dashboard siempre muestre algo útil.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Esta portada evita la sensación de “pantalla en blanco”. Desde aquí
          puedes entrar, configurar Supabase o ir directo al dashboard cuando
          ya tengas sesión.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={isConfigured ? "/login" : "/configuracion"}
            className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-medium text-[var(--surface-strong)] transition hover:opacity-90"
          >
            {isConfigured ? "Entrar al dashboard" : "Configurar Supabase"}
          </Link>
          <Link
            href="/inicio"
            className="rounded-full border border-[var(--line)] bg-white/80 px-5 py-3 text-sm font-medium text-[var(--ink)] transition hover:bg-white"
          >
            Ir al inicio
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[var(--line)] bg-white/80 px-5 py-3 text-sm font-medium text-[var(--ink)] transition hover:bg-white"
          >
            Login
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="app-card p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Estado actual
          </div>
          <p className="mt-3 text-lg font-semibold text-[var(--ink)]">
            {isConfigured ? "Supabase configurado" : "Faltan variables de entorno"}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {isConfigured
              ? "La app ya puede mostrar login y usar autenticación."
              : "Debes cargar las variables en Vercel para habilitar autenticación y datos."}
          </p>
        </article>

        <article className="app-card p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Primer módulo
          </div>
          <p className="mt-3 text-lg font-semibold text-[var(--ink)]">Tareas</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Ya tiene estructura, validación, API y UI. Solo falta aplicar la
            migración en Supabase si todavía no la corriste.
          </p>
        </article>

        <article className="app-card p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Siguiente paso
          </div>
          <p className="mt-3 text-lg font-semibold text-[var(--ink)]">
            Activar el flujo real
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Configurar Vercel, correr la migración SQL y luego entrar con login
            para empezar a crear tareas.
          </p>
        </article>
      </section>
    </main>
  );
}
