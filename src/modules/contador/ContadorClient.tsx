"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ContadorPageData } from "@/modules/contador/types";
import {
  buildMonthlyTaxCalendar,
  contadorAnnualObligations,
  contadorDocuments,
  contadorOfficialLinks,
  contadorProfile,
  contadorStartupTasks,
} from "@/modules/contador/data";

const statusCardStyles = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  upcoming: "border-amber-200 bg-amber-50 text-amber-700",
  attention: "border-rose-200 bg-rose-50 text-rose-700",
  future: "border-[var(--line)] bg-white text-[var(--muted)]",
} as const;

const taskStyles = {
  done: "text-emerald-600",
  pending: "text-[var(--ink)]",
  attention: "text-amber-600",
} as const;

function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatHumanDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function SectionPill(props: { label: string; tone?: "green" | "blue" | "orange" | "neutral" }) {
  const toneClass =
    props.tone === "green"
      ? "bg-emerald-100 text-emerald-700"
      : props.tone === "blue"
        ? "bg-blue-100 text-blue-700"
        : props.tone === "orange"
          ? "bg-orange-100 text-orange-700"
          : "bg-[#f2f0fb] text-[var(--muted)]";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
      {props.label}
    </span>
  );
}

export function ContadorClient(props: { initialData: ContadorPageData }) {
  const [checkpoints, setCheckpoints] = useState(props.initialData.checkpoints);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const monthlyCalendar = useMemo(
    () =>
      buildMonthlyTaxCalendar().map((item) =>
        checkpoints[item.id]
          ? {
              ...item,
              status: "done" as const,
              summary:
                item.status === "done"
                  ? item.summary
                  : `Marcado como presentado. ${item.summary}`,
            }
          : item,
      ),
    [checkpoints],
  );
  const [selectedCalendarId, setSelectedCalendarId] = useState(monthlyCalendar[0]?.id ?? "");
  const selectedItem =
    monthlyCalendar.find((item) => item.id === selectedCalendarId) ?? monthlyCalendar[0];

  async function toggleCheckpoint(
    itemKey: string,
    itemType: "monthly_tax" | "startup_task" | "annual_obligation",
  ) {
    const nextValue = !checkpoints[itemKey];
    setSavingKey(itemKey);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/contador/checkpoints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemKey,
        itemType,
        isCompleted: nextValue,
      }),
    });

    const payload = await response.json();
    setSavingKey(null);

    if (!response.ok) {
      setError(payload.error ?? "No se pudo actualizar el estado.");
      return;
    }

    setCheckpoints((current) => ({
      ...current,
      [itemKey]: nextValue,
    }));
    setMessage(nextValue ? "Obligacion marcada como completada." : "Obligacion reabierta.");
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_1.8fr]">
        <article className="app-card overflow-hidden p-0">
          <div className="border-b border-[var(--line)] bg-[linear-gradient(135deg,rgba(18,66,121,0.05),rgba(245,127,23,0.08))] px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-18 w-18 items-center justify-center overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white/90 p-2">
                <Image
                  src={contadorProfile.logoHref}
                  alt={contadorProfile.companyName}
                  width={120}
                  height={120}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
              <div className="flex items-center gap-2">
                  <SectionPill label="Empresa" tone="blue" />
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                    Perfil empresa
                  </span>
                </div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink)]">
                  {contadorProfile.companyName}
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">{contadorProfile.taxStatus}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-6 py-5 text-sm">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <span className="text-[var(--muted)]">Inicio actividades</span>
              <span className="font-semibold text-[var(--ink)]">
                {formatHumanDate(contadorProfile.startedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <span className="text-[var(--muted)]">Capital inicial</span>
              <span className="font-semibold text-[var(--ink)]">
                {formatClp(contadorProfile.capital)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <span className="text-[var(--muted)]">IVA</span>
              <span className="font-semibold text-[var(--ink)]">{contadorProfile.vatMode}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <span className="text-[var(--muted)]">Banco</span>
              <span className="font-semibold text-[var(--ink)]">
                {props.initialData.bankSummary.hasMovements
                  ? `${props.initialData.bankSummary.transactionCount} movimientos reales`
                  : "Sin movimientos reales"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">PPM</span>
              <span className="font-semibold text-[var(--ink)]">{contadorProfile.ppm}</span>
            </div>
          </div>
        </article>

        <article className="app-card p-6">
          <div className="flex items-center gap-2">
            <SectionPill label="SII" tone="blue" />
            <span className="text-lg font-semibold text-[var(--ink)]">
              Aunque no haya movimiento, igual puede existir obligacion mensual
            </span>
          </div>
          <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--ink)]">
            <p>
              Revise con cuidado el escenario real de la empresa: el SII informa que el
              <strong> F29 general vence el dia 20 del mes siguiente</strong>, mientras que
              <strong> sin movimiento y sin pago puede ir el dia 28</strong>.
            </p>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-4 text-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Lectura desde banco
              </div>
              <div className="mt-2 text-[var(--ink)]">
                {props.initialData.bankSummary.hasMovements ? (
                  <>
                    Hay <strong>{props.initialData.bankSummary.transactionCount} movimientos</strong>
                    {" "}registrados en banco. Ultimo movimiento:
                    {" "}
                    <strong>{props.initialData.bankSummary.latestTransactionDate ?? "-"}</strong>.
                  </>
                ) : (
                  <>
                    Aun no hay movimientos reales en banco. Si el periodo sigue sin actividad ni
                    pago, revisa si corresponde declarar sin movimiento.
                  </>
                )}
              </div>
            </div>
            <p>
              Tambien rescate de tu modulo viejo la necesidad de no olvidarse de DTE, RCV,
              patente municipal y la futura F22. Lo deje mas ordenado y con una separacion mas
              clara entre tareas iniciales, vencimientos mensuales y obligaciones anuales.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              {contadorOfficialLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="app-card p-6">
        <div className="flex items-center gap-2">
          <SectionPill label="Calendario" tone="green" />
          <div>
            <h2 className="text-2xl font-semibold text-[var(--ink)]">
              Calendario tributario visual
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Referencia para los proximos 12 periodos desde el inicio de actividades.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {monthlyCalendar.map((item) => (
              <div
                key={item.id}
                className={`rounded-[1.5rem] border p-4 text-left transition ${
                  statusCardStyles[item.status]
                } ${selectedCalendarId === item.id ? "ring-2 ring-[var(--accent)]/25" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCalendarId(item.id)}
                  className="w-full text-left"
                >
                  <div className="text-sm font-semibold text-[var(--ink)]">{item.periodLabel}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.18em]">
                    {item.status === "done"
                      ? "Presentado"
                      : item.status === "attention"
                        ? "Atencion"
                        : item.status === "upcoming"
                          ? "Proximo"
                          : "Pendiente"}
                  </div>
                  <div className="mt-3 text-sm">{item.dueLabel}</div>
                </button>
                <button
                  type="button"
                  onClick={() => toggleCheckpoint(item.id, "monthly_tax")}
                  disabled={savingKey === item.id}
                  className="mt-4 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)] disabled:opacity-60"
                >
                  {checkpoints[item.id] ? "Desmarcar" : "Marcar presentado"}
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-[1.75rem] border border-[var(--line)] bg-[#f2f0fb] p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              <SectionPill label="F29" tone="green" />
              Mes seleccionado
            </div>
            <h3 className="mt-3 text-2xl font-semibold text-[var(--ink)]">
              {selectedItem?.periodLabel}
            </h3>
            <p className="mt-2 text-sm leading-7 text-[var(--ink)]">{selectedItem?.summary}</p>

            <div className="mt-6 rounded-[1.25rem] border border-[var(--line)] bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Lectura recomendada
              </div>
              <ul className="mt-3 space-y-3 text-sm text-[var(--ink)]">
                <li>1. Revisar si el periodo tiene IVA, PPM o ambos.</li>
                <li>2. Si no hubo movimiento ni pago, verificar si corresponde declarar al dia 28.</li>
                <li>3. Si hubo operacion afecta, preparar respaldo y considerar el vencimiento general del dia 20.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="app-card p-6">
          <div className="flex items-center gap-2">
            <SectionPill label="Inicio" tone="green" />
            <div>
              <h2 className="text-2xl font-semibold text-[var(--ink)]">Tareas de inicio</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Rescate de tu flujo antiguo, pero ordenado por prioridad real.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {contadorStartupTasks.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.35rem] border border-[var(--line)] bg-white px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3
                      className={`text-base font-semibold ${
                        checkpoints[item.id] ? "text-emerald-600 line-through" : taskStyles[item.status]
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.note}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-[#f2f0fb] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                      {checkpoints[item.id] ? "Completado" : item.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCheckpoint(item.id, "startup_task")}
                      disabled={savingKey === item.id}
                      className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--ink)] disabled:opacity-60"
                    >
                      {checkpoints[item.id] ? "Desmarcar" : "Completar"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="app-card p-6">
          <div className="flex items-center gap-2">
            <SectionPill label="Fiscal" tone="orange" />
            <div>
              <h2 className="text-2xl font-semibold text-[var(--ink)]">
                Obligaciones anuales y condicionales
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Lo fijo va separado de lo que depende de regimen o de actividad real.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {contadorAnnualObligations.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.35rem] border border-[var(--line)] bg-white px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3
                      className={`text-base font-semibold ${
                        checkpoints[item.id] ? "text-emerald-600 line-through" : "text-[var(--ink)]"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.note}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-[#f2f0fb] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                      {item.monthLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCheckpoint(item.id, "annual_obligation")}
                      disabled={savingKey === item.id}
                      className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--ink)] disabled:opacity-60"
                    >
                      {checkpoints[item.id] ? "Desmarcar" : "Completar"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      {message ? (
        <section className="app-card p-4 text-center text-emerald-700">{message}</section>
      ) : null}

      {error ? (
        <section className="app-card p-4 text-center text-rose-700">{error}</section>
      ) : null}

      <section className="app-card p-6">
        <div className="flex items-center gap-2">
          <SectionPill label="PDF" tone="blue" />
          <div>
            <h2 className="text-2xl font-semibold text-[var(--ink)]">
              Documentos de la empresa
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              PDFs cargados al proyecto para descarga directa desde Vercel.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {contadorDocuments.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {item.kind === "societario" ? "Societario" : "Tributario"}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--ink)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {item.description}
                  </p>
                </div>
                <SectionPill label="Descarga" tone="green" />
              </div>

              <div className="mt-4 flex gap-3">
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
                >
                  Abrir
                </Link>
                <Link
                  href={item.href}
                  download
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Descargar
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
