import Link from "next/link";
import { APP_SECTIONS } from "@/lib/sections";

export default function Home() {
  const featuredSections = APP_SECTIONS.filter((section) => section.id !== "inicio").slice(0, 6);

  return (
    <main className="app-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="app-shell-surface rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="rounded-full border border-emerald-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Dashboard operativo personal
              </span>
              <h1 className="app-display mt-5 max-w-4xl text-5xl leading-none font-semibold text-[var(--ink)] sm:text-6xl">
                Un panel hecho para operar licitaciones, proyectos y trabajo real.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                Menos ruido, mejor foco. Fidel Dashboard ordena dominios distintos en una interfaz
                clara, rapida y usable desde escritorio y movil.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/login"
                className="rounded-full bg-[var(--ink)] px-5 py-3 text-center text-sm font-semibold text-[var(--sand)] transition hover:opacity-92"
              >
                Entrar al dashboard
              </Link>
              <Link
                href="/configuracion"
                className="rounded-full border border-[var(--line)] bg-white/80 px-5 py-3 text-center text-sm font-semibold text-[var(--ink)] transition hover:bg-white"
              >
                Configurar Supabase
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="app-card p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Filosofia del sitio
            </div>
            <h2 className="app-display mt-3 text-3xl font-semibold text-[var(--ink)]">
              Una base pensada para crecer sin deformarse.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-[15px]">
              Cada seccion vive por su cuenta, con contexto propio y una interfaz mas limpia. La
              portada ya no es una redireccion vacia: ahora presenta el sistema y deja clara la
              entrada correcta a cada flujo.
            </p>
          </article>

          <article className="app-card p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Secciones</p>
                <p className="mt-2 text-4xl font-semibold text-[var(--ink)]">
                  {APP_SECTIONS.length - 1}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Enfoque</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
                  Operacion, seguimiento y decisiones rapidas.
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Stack</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
                  Next.js 16, TypeScript y Supabase.
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredSections.map((section) => (
            <Link
              key={section.id}
              href="/login"
              className="app-card group p-5 transition duration-200 hover:-translate-y-1 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="text-lg font-semibold text-[var(--ink)]">{section.label}</div>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                  {section.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{section.description}</p>
              <p className="mt-5 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Entrar y abrir modulo
              </p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
