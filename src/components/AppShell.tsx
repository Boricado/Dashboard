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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] px-6 py-5 shadow-[0_24px_100px_rgba(49,46,37,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Dashboard modular
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">
                Fidel Dashboard
              </div>
              <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                Base limpia para trabajar por dominios cortos, con menos ruido y
                mejor contexto para IA.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm text-[var(--muted)] sm:block">
                Next.js + TypeScript + Supabase
              </div>
              <button
                onClick={signOut}
                className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--surface-strong)] transition hover:opacity-90"
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[0_20px_60px_rgba(49,46,37,0.08)] backdrop-blur xl:sticky xl:top-6">
            <div className="mb-4 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Regla del proyecto
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Cada sección vive en su ruta, su metadata y su propio
                <code className="ml-1 rounded-md bg-[var(--surface-strong)] px-1.5 py-0.5 text-xs text-[var(--ink)]">
                  CONTEXT.md
                </code>
                .
              </p>
            </div>

            <nav className="flex flex-col gap-1">
              {APP_SECTIONS.map((s) => {
                const isActive =
                  pathname === s.href || pathname?.startsWith(`${s.href}/`);

                return (
                  <Link
                    key={s.id}
                    href={s.href}
                    className={cx(
                      "rounded-[1.25rem] border px-4 py-3 text-sm transition",
                      isActive
                        ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface-strong)]"
                        : "border-transparent text-[var(--ink)] hover:border-[var(--line)] hover:bg-white/80",
                    )}
                  >
                    <div className="font-medium">{s.label}</div>
                    <div
                      className={cx(
                        "text-xs",
                        isActive
                          ? "text-[var(--surface-strong)]/75"
                          : "text-[var(--muted)]",
                      )}
                    >
                      {s.description}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[0_20px_70px_rgba(49,46,37,0.08)] backdrop-blur sm:p-6">
            {props.children}
          </main>
        </div>
      </div>
    </div>
  );
}
