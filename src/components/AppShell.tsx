"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_SECTIONS } from "@/lib/sections";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AppShell(props: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <div className="min-h-dvh text-[var(--ink)]">
      <div className="app-grid flex w-full flex-col gap-5 px-3 py-4 sm:px-4 lg:px-6 2xl:px-8">
        <header className="app-shell-surface rounded-[2rem] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Dashboard modular
              </div>
              <div className="app-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Fidel Dashboard
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-[15px]">
                Operacion diaria, licitaciones y modulos vivos en una sola base,
                con estructura clara para escritorio y movil.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm text-[var(--muted)]">
                Next.js + TypeScript + Supabase
              </div>
              <button
                onClick={signOut}
                className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--sand)] transition hover:opacity-90"
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="app-shell-surface overflow-x-auto rounded-[1.5rem] px-3 py-3 xl:hidden">
            <nav className="flex min-w-max gap-2">
              {APP_SECTIONS.map((section) => {
                const isActive =
                  pathname === section.href || pathname?.startsWith(`${section.href}/`);

                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    className={cx(
                      "rounded-full border px-4 py-2 text-sm whitespace-nowrap transition",
                      isActive
                        ? "border-emerald-200 bg-white text-emerald-700 shadow-[0_8px_20px_rgba(29,123,82,0.12)]"
                        : "border-[var(--line)] bg-white/75 text-[var(--ink)]",
                    )}
                  >
                    {section.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <aside className="app-shell-surface hidden h-fit rounded-[2rem] p-4 xl:sticky xl:top-6 xl:block">
            <div className="mb-4 rounded-[1.5rem] border border-[var(--line)] bg-white/85 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Regla del proyecto
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Cada seccion vive en su ruta, su metadata y su propio
                <code className="ml-1 rounded-md bg-[var(--surface-strong)] px-1.5 py-0.5 text-xs text-[var(--ink)]">
                  CONTEXT.md
                </code>
                .
              </p>
            </div>

            <nav className="flex flex-col gap-1">
              {APP_SECTIONS.map((section) => {
                const isActive =
                  pathname === section.href || pathname?.startsWith(`${section.href}/`);

                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    className={cx(
                      "rounded-[1.25rem] border px-4 py-3 text-sm transition",
                      isActive
                        ? "border-[#d7eee1] bg-white text-emerald-700 shadow-[0_6px_18px_rgba(20,122,61,0.08)]"
                        : "border-transparent text-[var(--ink)] hover:border-[var(--line)] hover:bg-white/80",
                    )}
                  >
                    <div className="font-medium">{section.label}</div>
                    <div
                      className={cx(
                        "text-xs",
                        isActive ? "text-emerald-700/75" : "text-[var(--muted)]",
                      )}
                    >
                      {section.description}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="app-shell-surface rounded-[2rem] p-4 sm:p-5 xl:p-6">
            {props.children}
          </main>
        </div>
      </div>
    </div>
  );
}
