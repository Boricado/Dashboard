import { getSectionById, type AppSectionId } from "@/lib/sections";

type SectionOverviewProps = {
  id: AppSectionId;
};

function BulletList(props: { items: string[] }) {
  return (
    <ul className="grid gap-2 text-sm text-[var(--muted)]">
      {props.items.map((item) => (
        <li
          key={item}
          className="rounded-2xl border border-[var(--line)] bg-white/75 px-4 py-3"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function SectionOverview({ id }: SectionOverviewProps) {
  const section = getSectionById(id);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_20px_80px_rgba(49,46,37,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              {section.status}
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--ink)]">
              {section.label}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              {section.summary}
            </p>
          </div>

          <div className="min-w-56 rounded-[1.5rem] border border-[var(--line)] bg-white/85 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Contexto IA
            </div>
            <code className="mt-2 block rounded-xl bg-[var(--surface-strong)] px-3 py-2 text-xs text-[var(--ink)]">
              {section.contextFile}
            </code>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Cuando trabajemos esta sección, basta con abrir este archivo y los
              componentes de su ruta.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Objetivo
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink)]">
            {section.description}
          </p>
        </article>

        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Próximo corte
          </h2>
          <BulletList items={section.nextSlice} />
        </article>

        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Datos iniciales
          </h2>
          <BulletList items={section.dataModel} />
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-white/80 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Límites del módulo
          </h2>
          <BulletList items={section.boundaries} />
        </article>

        <article className="rounded-[1.75rem] border border-[var(--line)] bg-white/80 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Checklist de implementación
          </h2>
          <BulletList items={section.checklist} />
        </article>
      </section>
    </div>
  );
}
