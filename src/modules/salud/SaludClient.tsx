"use client";

import { useState } from "react";
import {
  compositionMetrics,
  healthSummaryStats,
  inbodyComparisonRows,
  inbodyScans,
  latestMeasurement,
  routineTemplates,
  routineHtmlWeeks,
  sessionHistory,
  weeklyConsistency,
  workoutRoutines,
  weightTrend,
  type WorkoutDay,
} from "@/modules/salud/data";

const STATUS_STYLE: Record<WorkoutDay["status"], string> = {
  completed: "bg-emerald-100 text-emerald-900",
  today: "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  upcoming: "bg-[var(--surface-strong)] text-[var(--muted)]",
  rest: "bg-zinc-100 text-zinc-700",
};

function clamp(value: number, max: number) {
  if (max === 0) {
    return 0;
  }

  return Math.max(18, Math.round((value / max) * 100));
}

function formatSignedDelta(value: number) {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) {
    return "0";
  }

  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(Math.abs(rounded) % 1 === 0 ? 0 : 1)}`;
}

function SummaryCard(props: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "warning";
}) {
  const valueClass =
    props.tone === "warning" ? "text-amber-600" : "text-[var(--accent-strong)]";

  return (
    <article className="app-card p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        {props.label}
      </div>
      <div className={`mt-5 text-4xl font-semibold leading-none ${valueClass}`}>
        {props.value}
      </div>
      <div className="mt-3 text-sm text-[var(--muted)]">{props.detail}</div>
    </article>
  );
}

export function SaludClient() {
  const [selectedWeekId, setSelectedWeekId] = useState(workoutRoutines[0]?.id ?? "");
  const [selectedDayIndex, setSelectedDayIndex] = useState(4);
  const [selectedHtmlWeek, setSelectedHtmlWeek] = useState(12);

  const selectedWeek =
    workoutRoutines.find((week) => week.id === selectedWeekId) ?? workoutRoutines[0];

  const selectedDay = selectedWeek.days[selectedDayIndex] ?? selectedWeek.days[0];

  const selectedExercises = routineTemplates[selectedDay.session] ?? [];

  const maxConsistency = Math.max(...weeklyConsistency.map((item) => item.value));
  const maxWeight = Math.max(...weightTrend.map((item) => item.value));
  const latestScan = inbodyScans[inbodyScans.length - 1];
  const previousScan = inbodyScans[inbodyScans.length - 2];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_20px_80px_rgba(49,46,37,0.08)]">
        <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Modulo activo
        </span>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)]">
              Salud
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Una vista limpia para revisar composicion corporal, rutina semanal
              e historial de sesiones sin volver al archivo monstruo del proyecto viejo.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white/75 px-4 py-3 text-sm text-[var(--muted)]">
            Historial actual: {sessionHistory.length} sesiones rescatadas
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {healthSummaryStats.map((item) => (
          <SummaryCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <article className="app-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--ink)]">
                {latestMeasurement.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {latestMeasurement.dateLabel}
              </p>
            </div>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              Base inicial
            </span>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
            <div className="flex items-center justify-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-full border-[12px] border-[var(--accent)]/15 bg-white text-center shadow-[inset_0_0_0_1px_rgba(223,212,194,0.65)]">
                <div>
                  <div className="text-4xl font-semibold text-[var(--ink)]">
                    {latestMeasurement.bodyFat}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {latestMeasurement.bodyFatLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid content-start gap-5">
              {compositionMetrics.map((metric) => (
                <div key={metric.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-[var(--muted)]">{metric.label}</span>
                    <span className="font-semibold text-[var(--ink)]">{metric.value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[var(--accent)]/10">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${metric.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[1.75rem] bg-[var(--surface-strong)] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Tendencia de peso
              </div>
              <div className="mt-6 flex h-36 items-end gap-3">
                {weightTrend.map((point) => (
                  <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-2xl bg-[var(--accent)]/75"
                      style={{ height: `${clamp(point.value, maxWeight)}%` }}
                    />
                    <div className="text-[11px] text-[var(--muted)]">{point.label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-[var(--muted)]">
                Cambio acumulado visible entre mediciones rescatadas del InBody.
              </p>
            </div>
          </div>
        </article>

        <article className="app-card p-6">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">Consistencia</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Sesiones por semana</p>
          <div className="mt-6 flex h-44 items-end gap-3">
            {weeklyConsistency.map((point) => (
              <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-2xl bg-[var(--accent)]"
                  style={{ height: `${clamp(point.value, maxConsistency)}%` }}
                />
                <div className="text-[11px] font-medium text-[var(--muted)]">{point.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-white/70 p-4 text-sm leading-6 text-[var(--muted)]">
            El patron mas estable del bloque esta entre S10 y S11, con 6 sesiones.
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1.75fr)]">
        <article className="app-card p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--ink)]">
                Ultimo vs anterior
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {previousScan.label} frente a {latestScan.label}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm text-[var(--muted)]">
              {latestScan.heightCm} cm · {latestScan.age} años
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {inbodyComparisonRows.map((row) => {
              const delta = row.latestValue - row.previousValue;
              const positive =
                row.betterWhen === "higher" ? delta > 0 : delta < 0;
              const neutral = delta === 0;

              return (
                <div
                  key={row.label}
                  className="grid items-center gap-3 rounded-[1.5rem] border border-[var(--line)] bg-white/80 px-4 py-4 sm:grid-cols-[minmax(120px,1fr)_minmax(90px,auto)_minmax(90px,auto)_minmax(80px,auto)]"
                >
                  <div className="font-medium text-[var(--ink)]">{row.label}</div>
                  <div className="text-sm text-[var(--muted)]">
                    Ant: {row.previousValue.toFixed(1).replace(".0", "")} {row.unit}
                  </div>
                  <div className="text-sm font-semibold text-[var(--ink)]">
                    Act: {row.latestValue.toFixed(1).replace(".0", "")} {row.unit}
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-center text-xs font-semibold ${
                      neutral
                        ? "bg-zinc-100 text-zinc-700"
                        : positive
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-rose-100 text-rose-900"
                    }`}
                  >
                    {formatSignedDelta(delta)} {row.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="app-card p-6">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--ink)]">
              Timeline InBody
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Lecturas reconstruidas manualmente desde los escaneos originales.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[var(--line)]">
            <div className="grid grid-cols-[minmax(110px,1.1fr)_repeat(5,minmax(90px,1fr))] bg-[var(--surface-strong)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              <div>Fecha</div>
              <div>Peso</div>
              <div>Musc.</div>
              <div>Grasa</div>
              <div>PGC</div>
              <div>Score</div>
            </div>
            <div className="max-h-[340px] overflow-y-auto bg-white/80">
              {inbodyScans.map((scan) => (
                <div
                  key={scan.id}
                  className="grid grid-cols-[minmax(110px,1.1fr)_repeat(5,minmax(90px,1fr))] border-t border-[var(--line)] px-4 py-3 text-sm text-[var(--ink)] first:border-t-0"
                >
                  <div className="font-medium">{scan.label}</div>
                  <div>{scan.weightKg.toFixed(1)} kg</div>
                  <div>{scan.skeletalMuscleKg.toFixed(1)} kg</div>
                  <div>{scan.bodyFatMassKg.toFixed(1)} kg</div>
                  <div>{scan.bodyFatPercent.toFixed(1)}%</div>
                  <div>{scan.score}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Mejor PGC
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                {Math.min(...inbodyScans.map((scan) => scan.bodyFatPercent)).toFixed(1)}%
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Mejor score
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                {Math.max(...inbodyScans.map((scan) => scan.score))} pts
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Mejor musculo
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                {Math.max(...inbodyScans.map((scan) => scan.skeletalMuscleKg)).toFixed(1)} kg
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <article className="app-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--ink)]">
                Rutinas por semana
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Plantillas recuperadas del dashboard anterior y ordenadas por bloque.
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Registrar
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {workoutRoutines.map((week) => (
              <button
                key={week.id}
                type="button"
                onClick={() => {
                  setSelectedWeekId(week.id);
                  setSelectedDayIndex(0);
                  const weekNumber = Number(week.label.replace("Semana ", ""));
                  if (routineHtmlWeeks.includes(weekNumber)) {
                    setSelectedHtmlWeek(weekNumber);
                  }
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  week.id === selectedWeek.id
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--line)] bg-white/85 text-[var(--ink)]"
                }`}
              >
                {week.label.replace("Semana ", "S")}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-[var(--line)] bg-white/65 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold text-[var(--ink)]">
                  {selectedWeek.label}
                </div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  {selectedWeek.focus} · {selectedWeek.statusLabel}
                </div>
              </div>
              <div className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                {selectedWeek.days.filter((item) => item.status === "completed").length} completadas
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {selectedWeek.days.map((day, index) => {
                const isSelected = day.dayShort === selectedDay.dayShort;

                return (
                  <button
                    key={`${selectedWeek.id}-${day.dayShort}`}
                    type="button"
                    onClick={() => setSelectedDayIndex(index)}
                    className={`flex w-full items-center gap-4 rounded-[1.5rem] border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)]/6"
                        : "border-transparent bg-white/60 hover:border-[var(--line)]"
                    }`}
                  >
                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] text-sm font-semibold ${
                        isSelected
                          ? "bg-[var(--accent)] text-white"
                          : "bg-[var(--surface-strong)] text-[var(--muted)]"
                      }`}
                    >
                      {day.dayShort}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-semibold text-[var(--ink)]">
                        {day.session}
                      </div>
                      <div className="mt-1 text-sm text-[var(--muted)]">{day.dayName}</div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${STATUS_STYLE[day.status]}`}>
                      {day.note ?? day.status}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </article>

        <aside className="app-card p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Sesion seleccionada
          </div>
          <h3 className="mt-3 text-2xl font-semibold text-[var(--ink)]">
            {selectedDay.session}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {selectedDay.dayName} · {selectedWeek.label} · {selectedWeek.focus}
          </p>

          <div className="mt-6 space-y-3">
            {selectedExercises.map((exercise) => (
              <article
                key={`${selectedDay.session}-${exercise.name}`}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-[var(--ink)]">{exercise.name}</div>
                  <div className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
                    {exercise.series}
                  </div>
                </div>
                {exercise.load ? (
                  <div className="mt-2 text-sm text-[var(--muted)]">Carga: {exercise.load}</div>
                ) : null}
                {exercise.notes ? (
                  <div className="mt-1 text-sm text-[var(--muted)]">{exercise.notes}</div>
                ) : null}
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="app-card p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--ink)]">
              HTML original de rutina
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Rescatado desde tu dashboard anterior para que sigas viendo la version que ya te gustaba.
            </p>
          </div>
          <a
            href={`/rutina_semana${selectedHtmlWeek}.html`}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-2.5 text-sm font-semibold text-[var(--ink)]"
          >
            Abrir en pestaña
          </a>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {routineHtmlWeeks.map((week) => (
            <button
              key={week}
              type="button"
              onClick={() => setSelectedHtmlWeek(week)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedHtmlWeek === week
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--line)] bg-white/85 text-[var(--ink)]"
              }`}
            >
              S{week}
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white">
          <iframe
            key={selectedHtmlWeek}
            src={`/rutina_semana${selectedHtmlWeek}.html`}
            title={`Rutina semana ${selectedHtmlWeek}`}
            className="h-[820px] w-full"
          />
        </div>
      </section>

      <section className="app-card p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--ink)]">
              Historial de sesiones
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Base parcial rescatada desde scripts antiguos. Sirve para operar y luego completar.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm text-[var(--muted)]">
            {sessionHistory.length} sesiones visibles
          </div>
        </div>

        <div className="mt-6 max-h-[720px] overflow-y-auto pr-2">
          <div className="flex flex-col gap-3">
          {sessionHistory.map((item) => (
            <details
              key={item.id}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/75 p-4"
            >
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
                <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                  {item.date}
                </span>
                <span className="text-sm text-[var(--muted)]">{item.week}</span>
                <span className="text-lg font-semibold text-[var(--ink)]">{item.session}</span>
                <span className="ml-auto text-sm text-[var(--muted)]">{item.summary}</span>
              </summary>

              <div className="mt-4 grid gap-3 border-t border-[var(--line)] pt-4">
                {item.notes ? (
                  <p className="text-sm text-[var(--muted)]">{item.notes}</p>
                ) : null}
                {item.details.map((detail) => (
                  <div
                    key={`${item.id}-${detail}`}
                    className="rounded-2xl bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--muted)]"
                  >
                    {detail}
                  </div>
                ))}
              </div>
            </details>
          ))}
          </div>
        </div>
      </section>
    </div>
  );
}
