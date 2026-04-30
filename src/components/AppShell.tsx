"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_SECTIONS, type AppSectionId } from "@/lib/sections";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SectionIcon(props: { id: AppSectionId; className?: string }) {
  const common = {
    className: props.className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (props.id) {
    case "licitaciones":
      return (
        <svg {...common}>
          <path d="M7 21h10" />
          <path d="M8 21V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14" />
          <path d="M6 9h12" />
          <path d="M9 5V3h6v2" />
        </svg>
      );
    case "tareas":
      return (
        <svg {...common}>
          <path d="M5 4h14v16H5z" />
          <path d="m8 12 2.2 2.2L16 8.5" />
        </svg>
      );
    case "salud":
      return (
        <svg {...common}>
          <path d="M3 13h4l2-7 4 14 2-7h6" />
        </svg>
      );
    case "proyectos":
      return (
        <svg {...common}>
          <path d="M4 6h6l2 2h8v10a2 2 0 0 1-2 2H4z" />
          <path d="M4 6v12" />
        </svg>
      );
    case "muebles":
      return (
        <svg {...common}>
          <path d="M5 11h14v8H5z" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          <path d="M8 19v2" />
          <path d="M16 19v2" />
        </svg>
      );
    case "banco":
      return (
        <svg {...common}>
          <path d="M3 10h18" />
          <path d="m5 10 7-5 7 5" />
          <path d="M6 10v8" />
          <path d="M10 10v8" />
          <path d="M14 10v8" />
          <path d="M18 10v8" />
          <path d="M4 18h16" />
        </svg>
      );
    case "contador":
      return (
        <svg {...common}>
          <path d="M9 3h6" />
          <path d="M10 3v5l-4 8a3 3 0 0 0 2.7 5h6.6A3 3 0 0 0 18 16l-4-8V3" />
          <path d="M8 14h8" />
        </svg>
      );
  }
}

export function AppShell(props: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const activeSection = APP_SECTIONS.find(
    (section) => pathname === section.href || pathname?.startsWith(`${section.href}/`),
  );
  const bottomSections = APP_SECTIONS;

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <div className="min-h-dvh overflow-x-hidden text-[var(--ink)]">
      <div className="app-grid flex w-full min-w-0 flex-col gap-3 px-2 py-2 pb-24 sm:px-4 sm:py-4 xl:gap-5 xl:px-6 xl:pb-6 2xl:px-8">
        <header className="app-shell-surface hidden rounded-xl px-3 py-3 sm:px-4 xl:block xl:rounded-2xl xl:px-6 xl:py-5">
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

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ecefec] bg-white/96 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-10px_28px_rgba(23,38,27,0.10)] backdrop-blur-xl xl:hidden"
        aria-label="Navegacion principal"
      >
        <div className="app-bottom-nav mx-auto flex max-w-lg snap-x gap-1 overflow-x-auto px-2">
          {bottomSections.map((section) => {
            const isActive =
              pathname === section.href || pathname?.startsWith(`${section.href}/`);

            return (
              <Link
                key={section.id}
                href={section.href}
                aria-current={isActive ? "page" : undefined}
                className={cx(
                  "flex min-w-[66px] snap-center flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-1.5 text-center text-[10px] font-semibold leading-none transition",
                  isActive
                    ? "bg-[#edf7f1] text-[var(--accent-strong)]"
                    : "text-[#626b64] active:bg-[#f4f6f4]",
                )}
              >
                <span
                  className={cx(
                    "grid size-9 place-items-center rounded-2xl transition",
                    isActive
                      ? "bg-[var(--accent)] text-white shadow-[0_8px_18px_rgba(29,123,82,0.22)]"
                      : "text-[#5d665f]",
                  )}
                >
                  <SectionIcon id={section.id} className="size-5" />
                </span>
                <span className="block max-w-[64px] truncate text-current">{section.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
