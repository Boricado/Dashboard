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
  const activeSection = APP_SECTIONS.find(
    (section) => pathname === section.href || pathname?.startsWith(`${section.href}/`),
  );
  const bottomSections = APP_SECTIONS.filter((section) =>
    ["tareas", "salud"].includes(section.id),
  );

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <div className="min-h-dvh overflow-x-hidden text-[var(--ink)]">
      <div className="app-grid flex w-full min-w-0 flex-col gap-3 px-2 py-2 pb-24 sm:px-4 sm:py-4 xl:gap-5 xl:px-6 xl:pb-6 2xl:px-8">
        <header className="app-shell-surface rounded-xl px-3 py-3 sm:px-4 xl:rounded-2xl xl:px-6 xl:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="app-display truncate text-xl font-semibold sm:text-2xl xl:text-4xl">
                Fidel
              </div>
              <div className="mt-0.5 truncate text-xs font-medium text-[var(--muted)] xl:text-sm">
                {activeSection?.label ?? "Dashboard"}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={signOut}
                className="rounded-lg bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 sm:text-sm"
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-5">
          <aside className="app-shell-surface hidden h-fit rounded-2xl p-3 xl:sticky xl:top-6 xl:block">
            <nav className="flex flex-col gap-1">
              {APP_SECTIONS.map((section) => {
                const isActive =
                  pathname === section.href || pathname?.startsWith(`${section.href}/`);

                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    className={cx(
                      "rounded-xl border px-3 py-2.5 text-sm transition",
                      isActive
                        ? "border-[#cfe7d8] bg-white text-emerald-700 shadow-[0_6px_18px_rgba(20,122,61,0.08)]"
                        : "border-transparent text-[var(--ink)] hover:border-[var(--line)] hover:bg-white/80",
                    )}
                  >
                    <div className="font-medium">{section.label}</div>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="app-content min-w-0">
            {props.children}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/94 px-4 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(27,34,29,0.12)] backdrop-blur xl:hidden">
        <div className="mx-auto grid max-w-sm grid-cols-2 gap-2">
          {bottomSections.map((section) => {
            const isActive =
              pathname === section.href || pathname?.startsWith(`${section.href}/`);

            return (
              <Link
                key={section.id}
                href={section.href}
                className={cx(
                  "flex h-12 items-center justify-center rounded-xl text-sm font-semibold transition",
                  isActive
                    ? "bg-[var(--ink)] text-white"
                    : "border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]",
                )}
              >
                {section.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
