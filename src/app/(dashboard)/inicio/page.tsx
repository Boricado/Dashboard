import Link from "next/link";
import { APP_SECTIONS } from "@/lib/sections";

export default function InicioPage() {
  return (
    <div className="flex flex-col gap-5">
      <section className="app-card overflow-hidden p-6 sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Inicio operativo
            </span>
            <h1 className="app-display mt-4 text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">
              Un tablero mas claro para trabajar todos los dias.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-[15px]">
              Esta portada ya no es una pantalla fria. Ahora funciona como mapa real del sistema:
              te orienta, resume el estado del dashboard y te lleva a cada modulo sin ruido.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-[1.5rem] border border-[var(--line)] bg-white/85 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Modulos</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--ink)]">
                {APP_SECTIONS.length - 1}
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-[var(--line)] bg-white/85 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Base</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
                Navegacion mas limpia y usable.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-[var(--line)] bg-white/85 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Foco</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
                Licitaciones, proyectos y operacion.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {APP_SECTIONS.filter((section) => section.id !== "inicio").map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="app-card p-5 transition hover:-translate-y-0.5 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-base font-semibold">{section.label}</div>
              <span className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {section.status}
              </span>
            </div>
            <div className="mt-2 text-sm leading-6 text-[var(--muted)]">{section.description}</div>
            <div className="mt-5 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              {section.contextFile}
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="app-card p-5">
          <div className="text-sm font-medium">Contexto por seccion</div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Cuando trabajemos una seccion, abrimos solo su
            <code className="ml-1 rounded bg-[var(--surface-strong)] px-1 py-0.5 text-[12px]">
              CONTEXT.md
            </code>
            y sus archivos del modulo.
          </p>
        </article>

        <article className="app-card p-5">
          <div className="text-sm font-medium">Criterio visual</div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            La base ahora prioriza aire, jerarquia y navegacion util. La idea es que el dashboard
            se sienta mas producto y menos plantilla.
          </p>
        </article>
      </section>
    </div>
  );
}
