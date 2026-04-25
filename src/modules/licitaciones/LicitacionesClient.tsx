"use client";

import { useMemo, useState } from "react";
import {
  LICITACION_TRACKING_STAGES,
  type LicitacionesPageData,
  type LicitacionTrackingStage,
  type LicitacionWithTracking,
} from "@/modules/licitaciones/types";

type Filters = {
  search: string;
  stage: "todas" | LicitacionTrackingStage;
};

type Draft = {
  stage: LicitacionTrackingStage;
};

function formatClp(value: number | null) {
  if (value == null) {
    return "No informado";
  }

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function createDraft(item: LicitacionWithTracking): Draft {
  return {
    stage: item.tracking?.stage ?? "sin_revisar",
  };
}

function getStageLabel(stage: LicitacionTrackingStage) {
  switch (stage) {
    case "sin_revisar":
      return "Sin revisar";
    case "revisada":
      return "Revisada";
    case "postulada":
      return "Postulada";
    case "descartada":
      return "Descartada";
    default:
      return stage;
  }
}

function getStageBadge(stage: LicitacionTrackingStage) {
  switch (stage) {
    case "revisada":
      return "bg-sky-50 text-sky-700";
    case "postulada":
      return "bg-emerald-50 text-emerald-700";
    case "descartada":
      return "bg-stone-100 text-stone-500";
    case "sin_revisar":
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export function LicitacionesClient(props: { initialData: LicitacionesPageData }) {
  const [items, setItems] = useState(props.initialData.items);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(props.initialData.items.map((item) => [item.id, createDraft(item)])),
  );
  const [filters, setFilters] = useState<Filters>({
    search: "",
    stage: "todas",
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return items.filter((item) => {
      const stage = drafts[item.id]?.stage ?? "sin_revisar";

      if (filters.stage !== "todas" && stage !== filters.stage) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        item.codigo_licitacion,
        item.titulo,
        item.region,
        item.organismo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [drafts, filters, items]);

  const summary = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        const stage = drafts[item.id]?.stage ?? "sin_revisar";
        acc.total += 1;
        if (stage === "sin_revisar") acc.pending += 1;
        if (stage === "revisada") acc.reviewed += 1;
        if (stage === "postulada") acc.applied += 1;
        if (stage === "descartada") acc.discarded += 1;
        return acc;
      },
      { total: 0, pending: 0, reviewed: 0, applied: 0, discarded: 0 },
    );
  }, [drafts, filteredItems]);

  function updateDraft(id: string, stage: LicitacionTrackingStage) {
    setDrafts((current) => ({
      ...current,
      [id]: { stage },
    }));
  }

  async function saveTracking(id: string) {
    const draft = drafts[id];

    if (!draft) {
      return;
    }

    setSavingId(id);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/licitaciones/${id}/tracking`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage: draft.stage,
          priority: "media",
          hidden: false,
          is_favorite: false,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        tracking?: LicitacionWithTracking["tracking"];
      };

      if (!response.ok || !payload.tracking) {
        throw new Error(payload.error ?? "No se pudo guardar la accion.");
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                tracking: payload.tracking ?? null,
              }
            : item,
        ),
      );
      setMessage("Accion guardada.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "No se pudo guardar la accion.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
        <article className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Modulo activo</p>
          <h1 className="mt-3 text-4xl font-semibold text-stone-900">Licitaciones</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Tablero simple para decidir rapido: revisar, postular o descartar.
          </p>
          <p className="mt-4 text-xs text-stone-500">
            Ultima lectura del modulo: {formatDate(props.initialData.fetched_at)}
          </p>
        </article>

        <article className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_16px_30px_rgba(15,23,42,0.05)]">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Total</p>
          <p className="mt-4 text-4xl font-semibold text-stone-900">{summary.total}</p>
        </article>

        <article className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_16px_30px_rgba(15,23,42,0.05)]">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Sin revisar</p>
          <p className="mt-4 text-4xl font-semibold text-amber-600">{summary.pending}</p>
        </article>

        <article className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_16px_30px_rgba(15,23,42,0.05)]">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Revisadas</p>
          <p className="mt-4 text-4xl font-semibold text-sky-700">{summary.reviewed}</p>
        </article>

        <article className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_16px_30px_rgba(15,23,42,0.05)]">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Postuladas</p>
          <p className="mt-4 text-4xl font-semibold text-emerald-700">{summary.applied}</p>
        </article>
      </div>

      <article className="rounded-[26px] border border-stone-200 bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr]">
          <input
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
            placeholder="Buscar por codigo, nombre, region u organismo"
            className="rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
          />

          <select
            value={filters.stage}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                stage: event.target.value as Filters["stage"],
              }))
            }
            className="rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
          >
            <option value="todas">Todas las acciones</option>
            {LICITACION_TRACKING_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {getStageLabel(stage)}
              </option>
            ))}
          </select>
        </div>

        {message ? (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}
      </article>

      <article className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-[0.28em] text-stone-500">
                <th className="px-5 py-4">Codigo</th>
                <th className="px-5 py-4">Nombre</th>
                <th className="px-5 py-4">Region</th>
                <th className="px-5 py-4">Monto</th>
                <th className="px-5 py-4">Cierre</th>
                <th className="px-5 py-4">Accion</th>
                <th className="px-5 py-4">Guardar</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-sm text-stone-500">
                    No hay licitaciones para los filtros actuales.
                  </td>
                </tr>
              ) : null}

              {filteredItems.map((item) => {
                const draft = drafts[item.id] ?? createDraft(item);

                return (
                  <tr key={item.id} className="border-b border-stone-100 align-top">
                    <td className="px-5 py-4 text-sm font-medium text-stone-700">
                      {item.codigo_licitacion}
                    </td>
                    <td className="px-5 py-4">
                      <div className="max-w-[34rem] space-y-2">
                        <p className="text-sm font-medium leading-6 text-stone-900">{item.titulo}</p>
                        <p className="text-xs text-stone-500">
                          {item.organismo ?? "Organismo no informado"}
                        </p>
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                          >
                            Abrir ficha
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {item.region ?? "Sin region"}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {formatClp(item.monto_estimado)}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {formatDate(item.fecha_cierre)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {LICITACION_TRACKING_STAGES.map((stage) => {
                          const active = draft.stage === stage;

                          return (
                            <button
                              key={stage}
                              type="button"
                              onClick={() => updateDraft(item.id, stage)}
                              className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                                active
                                  ? getStageBadge(stage)
                                  : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                              }`}
                            >
                              {getStageLabel(stage)}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => saveTracking(item.id)}
                        disabled={savingId === item.id}
                        className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === item.id ? "Guardando..." : "Guardar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
