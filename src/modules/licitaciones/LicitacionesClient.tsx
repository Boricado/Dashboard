"use client";

import { useMemo, useState } from "react";
import {
  LICITACION_PRIORITY_LEVELS,
  LICITACION_TRACKING_STAGES,
  type LicitacionPriorityLevel,
  type LicitacionesPageData,
  type LicitacionTrackingStage,
  type LicitacionWithTracking,
} from "@/modules/licitaciones/types";

type Filters = {
  search: string;
  stage: "todas" | LicitacionTrackingStage;
  onlyFavorites: boolean;
};

type Draft = {
  stage: LicitacionTrackingStage;
  priority: LicitacionPriorityLevel;
  next_step: string;
  notes: string;
  follow_up_at: string;
  is_favorite: boolean;
};

function formatClp(value: number | null) {
  if (value == null) {
    return "Monto no informado";
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

function toInputDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function createDraft(item: LicitacionWithTracking): Draft {
  return {
    stage: item.tracking?.stage ?? "sin_revisar",
    priority: item.tracking?.priority ?? "media",
    next_step: item.tracking?.next_step ?? "",
    notes: item.tracking?.notes ?? "",
    follow_up_at: toInputDateTime(item.tracking?.follow_up_at ?? null),
    is_favorite: item.tracking?.is_favorite ?? false,
  };
}

function getStageLabel(stage: LicitacionTrackingStage) {
  switch (stage) {
    case "sin_revisar":
      return "Sin revisar";
    case "revisando":
      return "Revisando";
    case "postular":
      return "Postular";
    case "seguimiento":
      return "Seguimiento";
    case "descartada":
      return "Descartada";
    default:
      return stage;
  }
}

function getPriorityLabel(priority: LicitacionPriorityLevel) {
  switch (priority) {
    case "alta":
      return "Alta";
    case "media":
      return "Media";
    case "baja":
      return "Baja";
    default:
      return priority;
  }
}

export function LicitacionesClient(props: { initialData: LicitacionesPageData }) {
  const [items, setItems] = useState(props.initialData.items);
  const referenceNow = useMemo(
    () => new Date(props.initialData.fetched_at).getTime(),
    [props.initialData.fetched_at],
  );
  const [filters, setFilters] = useState<Filters>({
    search: "",
    stage: "todas",
    onlyFavorites: false,
  });
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(props.initialData.items.map((item) => [item.id, createDraft(item)])),
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return items.filter((item) => {
      const draft = drafts[item.id] ?? createDraft(item);

      if (filters.stage !== "todas" && draft.stage !== filters.stage) {
        return false;
      }

      if (filters.onlyFavorites && !draft.is_favorite) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        item.codigo_licitacion,
        item.titulo,
        item.organismo,
        item.comprador,
        item.categoria,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [drafts, filters, items]);

  const summary = useMemo(() => {
    const nextWeek = referenceNow + 7 * 24 * 60 * 60 * 1000;

    return filteredItems.reduce(
      (acc, item) => {
        const draft = drafts[item.id] ?? createDraft(item);
        const closeAt = item.fecha_cierre ? new Date(item.fecha_cierre).getTime() : null;

        acc.total += 1;
        if (draft.stage !== "descartada") {
          acc.potential += item.monto_estimado ?? 0;
        }
        if (draft.stage === "revisando" || draft.stage === "postular" || draft.stage === "seguimiento") {
          acc.following += 1;
        }
        if (closeAt && closeAt >= referenceNow && closeAt <= nextWeek) {
          acc.closingSoon += 1;
        }

        return acc;
      },
      { total: 0, following: 0, closingSoon: 0, potential: 0 },
    );
  }, [drafts, filteredItems, referenceNow]);

  function updateDraft<K extends keyof Draft>(id: string, key: K, value: Draft[K]) {
    setDrafts((current) => {
      const found = items.find((item) => item.id === id);
      if (!found) {
        return current;
      }

      return {
        ...current,
        [id]: {
          ...(current[id] ?? createDraft(found)),
          [key]: value,
        },
      };
    });
  }

  async function saveTracking(id: string) {
    const draft = drafts[id];

    if (!draft) {
      return;
    }

    setSavingId(id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/licitaciones/${id}/tracking`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage: draft.stage,
          priority: draft.priority,
          next_step: draft.next_step,
          notes: draft.notes,
          follow_up_at: draft.follow_up_at || null,
          is_favorite: draft.is_favorite,
          hidden: false,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        tracking?: LicitacionWithTracking["tracking"];
      };

      if (!response.ok || !payload.tracking) {
        throw new Error(payload.error ?? "No se pudo guardar el seguimiento.");
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
      setMessage("Seguimiento guardado.");
    } catch (caughtError) {
      const messageText =
        caughtError instanceof Error ? caughtError.message : "No se pudo guardar el seguimiento.";
      setError(messageText);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr_1fr_1fr]">
        <article className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Modulo activo</p>
          <h1 className="mt-3 text-4xl font-semibold text-stone-900">Licitaciones</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Oportunidades sincronizadas desde Mercado Publico, separadas de tu capa de
            seguimiento para que el cron no pise tus notas ni tus decisiones.
          </p>
          <p className="mt-4 text-xs text-stone-500">
            Ultima lectura del modulo: {formatDate(props.initialData.fetched_at)}
          </p>
        </article>

        <article className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_16px_30px_rgba(15,23,42,0.05)]">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Total visibles</p>
          <p className="mt-4 text-4xl font-semibold text-stone-900">{summary.total}</p>
          <p className="mt-2 text-sm text-stone-500">Con filtros actuales</p>
        </article>

        <article className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_16px_30px_rgba(15,23,42,0.05)]">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Siguiendo</p>
          <p className="mt-4 text-4xl font-semibold text-emerald-700">{summary.following}</p>
          <p className="mt-2 text-sm text-stone-500">Revisando, postular o seguimiento</p>
        </article>

        <article className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_16px_30px_rgba(15,23,42,0.05)]">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Cierre proximo</p>
          <p className="mt-4 text-4xl font-semibold text-amber-600">{summary.closingSoon}</p>
          <p className="mt-2 text-sm text-stone-500">Vencen en los proximos 7 dias</p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <article className="rounded-[26px] border border-stone-200 bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-stone-900">Filtro operativo</h2>
              <p className="mt-2 text-sm text-stone-500">
                Busca por codigo, organismo o titulo. La capa de seguimiento es solo tuya.
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              Potencial: {formatClp(summary.potential)}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1.5fr_0.9fr_auto]">
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Buscar por codigo, organismo o titulo"
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
              <option value="todas">Todas las etapas</option>
              {LICITACION_TRACKING_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {getStageLabel(stage)}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={filters.onlyFavorites}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    onlyFavorites: event.target.checked,
                  }))
                }
              />
              Solo favoritas
            </label>
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

        <article className="rounded-[26px] border border-stone-200 bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <h2 className="text-2xl font-semibold text-stone-900">Base del cron</h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            El sync queda separado en `supabase/functions/sync-licitaciones-coquimbo` y la tabla
            guarda tambien `source_payload` para rescatar campos nuevos sin romper la UI.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-stone-600">
            <li>Region objetivo: Coquimbo</li>
            <li>Monto maximo: 10.000.000 CLP</li>
            <li>Estado API: publicadas / abiertas</li>
            <li>Seguimiento tuyo: etapa, prioridad, notas y proximo paso</li>
          </ul>
        </article>
      </div>

      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <article className="rounded-[26px] border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
            Aun no hay licitaciones sincronizadas o los filtros dejaron la lista vacia.
          </article>
        ) : null}

        {filteredItems.map((item) => {
          const draft = drafts[item.id] ?? createDraft(item);

          return (
            <article
              key={item.id}
              className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-stone-600">
                      {item.codigo_licitacion}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      {item.region ?? "Sin region"}
                    </span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                      {getStageLabel(draft.stage)}
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      Prioridad {getPriorityLabel(draft.priority)}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold text-stone-900">{item.titulo}</h3>
                  <p className="text-sm text-stone-500">
                    {item.organismo ?? "Organismo no informado"}
                    {item.comprador ? ` · ${item.comprador}` : ""}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Monto</p>
                  <p className="mt-2 text-2xl font-semibold text-stone-900">
                    {formatClp(item.monto_estimado)}
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    Cierra {formatDate(item.fecha_cierre)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Descripcion</p>
                      <p className="mt-3 text-sm leading-7 text-stone-700">
                        {item.descripcion ?? "Sin descripcion rescatada en esta sincronizacion."}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Fuente</p>
                      <p className="mt-3 text-sm leading-7 text-stone-700">
                        Estado API: {item.estado_api ?? "sin dato"}
                        <br />
                        Ultimo sync: {formatDate(item.last_synced_at)}
                      </p>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex rounded-full border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Abrir ficha
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-stone-200 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-stone-600">
                      <span className="text-xs uppercase tracking-[0.28em] text-stone-500">
                        Etapa
                      </span>
                      <select
                        value={draft.stage}
                        onChange={(event) =>
                          updateDraft(item.id, "stage", event.target.value as LicitacionTrackingStage)
                        }
                        className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                      >
                        {LICITACION_TRACKING_STAGES.map((stage) => (
                          <option key={stage} value={stage}>
                            {getStageLabel(stage)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm text-stone-600">
                      <span className="text-xs uppercase tracking-[0.28em] text-stone-500">
                        Prioridad
                      </span>
                      <select
                        value={draft.priority}
                        onChange={(event) =>
                          updateDraft(
                            item.id,
                            "priority",
                            event.target.value as LicitacionPriorityLevel,
                          )
                        }
                        className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                      >
                        {LICITACION_PRIORITY_LEVELS.map((priority) => (
                          <option key={priority} value={priority}>
                            {getPriorityLabel(priority)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <label className="space-y-2 text-sm text-stone-600">
                      <span className="text-xs uppercase tracking-[0.28em] text-stone-500">
                        Proximo paso
                      </span>
                      <input
                        value={draft.next_step}
                        onChange={(event) => updateDraft(item.id, "next_step", event.target.value)}
                        placeholder="Ej: revisar bases, llamar proveedor, pedir garantia"
                        className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                      />
                    </label>

                    <label className="space-y-2 text-sm text-stone-600">
                      <span className="text-xs uppercase tracking-[0.28em] text-stone-500">
                        Seguimiento
                      </span>
                      <input
                        type="datetime-local"
                        value={draft.follow_up_at}
                        onChange={(event) => updateDraft(item.id, "follow_up_at", event.target.value)}
                        className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                      />
                    </label>

                    <label className="space-y-2 text-sm text-stone-600">
                      <span className="text-xs uppercase tracking-[0.28em] text-stone-500">
                        Notas
                      </span>
                      <textarea
                        value={draft.notes}
                        onChange={(event) => updateDraft(item.id, "notes", event.target.value)}
                        rows={4}
                        placeholder="Resumen rapido, riesgos, documentos pendientes, competidores, etc."
                        className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-3 text-sm text-stone-600">
                      <input
                        type="checkbox"
                        checked={draft.is_favorite}
                        onChange={(event) =>
                          updateDraft(item.id, "is_favorite", event.target.checked)
                        }
                      />
                      Marcar como favorita
                    </label>

                    <button
                      type="button"
                      onClick={() => saveTracking(item.id)}
                      disabled={savingId === item.id}
                      className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingId === item.id ? "Guardando..." : "Guardar seguimiento"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
