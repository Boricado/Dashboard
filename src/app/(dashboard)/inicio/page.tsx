import Link from "next/link";
import { APP_SECTIONS } from "@/lib/sections";

export default function InicioPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_20px_80px_rgba(49,46,37,0.08)]">
        <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Reinicio limpio
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Inicio</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Este dashboard fue replanteado para evitar el archivo gigante del
          proyecto anterior. Cada sección tiene su propia ruta, metadata y
          contexto para que podamos trabajar por partes sin gastar contexto de
          más.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {APP_SECTIONS.filter((section) => section.id !== "inicio").map(
          (section) => (
            <Link
              key={section.id}
              href={section.href}
              className="rounded-[1.75rem] border border-[var(--line)] bg-white/80 p-5 transition hover:-translate-y-0.5 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-base font-semibold">{section.label}</div>
                <span className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {section.status}
                </span>
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {section.description}
              </div>
              <div className="mt-4 text-xs text-[var(--muted)]">
                {section.contextFile}
              </div>
            </Link>
          ),
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="app-card p-5">
          <div className="text-sm font-medium">Contexto por sección</div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Cuando trabajemos “Salud”, por ejemplo, vamos a referenciar solo{" "}
            <code className="rounded bg-[var(--surface-strong)] px-1 py-0.5 text-[12px]">
              src/modules/salud/CONTEXT.md
            </code>{" "}
            y los archivos de ese módulo.
          </p>
        </article>

        <article className="app-card p-5">
          <div className="text-sm font-medium">Ruido eliminado</div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Dejamos fuera scripts sueltos, datos enormes, parches temporales y
            componentes monstruo. Si algo del proyecto viejo vale la pena, lo
            migramos como pieza aislada, no como herencia completa.
          </p>
        </article>
      </section>
    </div>
  );
}
