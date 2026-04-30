import Link from "next/link";
import { APP_SECTIONS } from "@/lib/sections";

const quickSections = APP_SECTIONS.filter((section) =>
  ["tareas", "salud", "licitaciones", "banco"].includes(section.id),
);

export default function InicioPage() {
  return (
    <div className="grid gap-3 sm:gap-4">
      <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
            Inicio
          </h1>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--muted)]">
          {APP_SECTIONS.length - 1} modulos
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {quickSections.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="app-card flex min-h-24 flex-col justify-between p-4 transition hover:bg-white"
          >
            <span className="text-base font-semibold text-[var(--ink)]">
              {section.label}
            </span>
            <span className="text-xs font-medium text-[var(--muted)]">
              Abrir
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {APP_SECTIONS.filter((section) => section.id !== "inicio").map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="rounded-lg border border-[var(--line)] bg-white/85 px-4 py-3 text-sm font-medium text-[var(--ink)] transition hover:border-emerald-200 hover:text-emerald-700"
          >
            {section.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
