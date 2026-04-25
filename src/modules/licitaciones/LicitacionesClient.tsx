"use client";

import { useEffect, useMemo, useState } from "react";
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

type SortKey =
  | "codigo_licitacion"
  | "titulo"
  | "region"
  | "monto_estimado"
  | "fecha_cierre"
  | "dias_restantes";

type SortState = {
  key: SortKey;
  direction: "asc" | "desc";
};

type Draft = {
  stage: LicitacionTrackingStage;
};

const DEFAULT_KEYWORDS_TEXT = [
  "constructor civil",
  "ingeniero constructor",
  "ingeniero en construccion",
  "ingeniero en construcción",
  "topografia",
  "topografía",
  "levantamiento topografico",
  "levantamiento topográfico",
  "geomensura",
  "geomensor",
  "geodesia",
  "inspeccion tecnica",
  "inspección técnica",
  "asesoria tecnica",
  "asesoría técnica",
  "ito",
  "ato",
  "obra civil",
  "obras civiles",
  "construccion",
  "construcción",
  "edificacion",
  "edificación",
  "infraestructura",
  "urbanizacion",
  "urbanización",
  "pavimentacion",
  "pavimentación",
  "vialidad",
  "movimiento de tierra",
  "cubicacion",
  "cubicación",
  "mensura",
  "levantamiento planimetrico",
  "levantamiento planimétrico",
  "levantamiento altimetrico",
  "levantamiento altimétrico",
  "trazado topografico",
  "trazado topográfico",
  "cartografia",
  "cartografía",
  "sig",
  "gis",
  "geomatica",
  "geomática",
  "informatica",
  "informática",
  "software",
  "desarrollo de software",
  "sistemas",
  "tecnologias de la informacion",
  "tecnologías de la información",
  "soporte informatico",
  "soporte informático",
  "redes y comunicaciones",
  "ciberseguridad",
  "transformacion digital",
  "transformación digital",
  "plataforma web",
].join("\n");

const KEYWORDS_TEXT_STORAGE_KEY = "licitaciones.keyword-text";
const KEYWORDS_ENABLED_STORAGE_KEY = "licitaciones.keyword-enabled";

function getSourcePayloadValue(
  payload: Record<string, unknown> | null | undefined,
  key: string,
) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload[key] ?? null;
}

function getNestedSourcePayloadValue(
  payload: Record<string, unknown> | null | undefined,
  parentKey: string,
  childKey: string,
) {
  const parent = getSourcePayloadValue(payload, parentKey);

  if (!parent || typeof parent !== "object" || Array.isArray(parent)) {
    return null;
  }

  return (parent as Record<string, unknown>)[childKey] ?? null;
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    if (!cleaned) {
      return null;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseKeywordText(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((keyword) => normalizeText(keyword))
    .filter(Boolean);
}

function getDisplayRegion(item: LicitacionWithTracking) {
  return (
    item.region ??
    (getNestedSourcePayloadValue(item.source_payload, "Comprador", "RegionUnidad") as string | null) ??
    (getSourcePayloadValue(item.source_payload, "Region") as string | null) ??
    (getSourcePayloadValue(item.source_payload, "RegionUnidad") as string | null) ??
    null
  );
}

function getDisplayOrganismo(item: LicitacionWithTracking) {
  return (
    item.organismo ??
    (getNestedSourcePayloadValue(item.source_payload, "Comprador", "NombreOrganismo") as
      | string
      | null) ??
    null
  );
}

function getDisplayUnidad(item: LicitacionWithTracking) {
  return (
    item.comprador ??
    (getNestedSourcePayloadValue(item.source_payload, "Comprador", "NombreUnidad") as
      | string
      | null) ??
    null
  );
}

function getDisplayAmount(item: LicitacionWithTracking) {
  return (
    item.monto_estimado ??
    parseNumber(getSourcePayloadValue(item.source_payload, "MontoEstimado")) ??
    null
  );
}

function getDisplayCategoria(item: LicitacionWithTracking) {
  return (
    item.categoria ??
    (getSourcePayloadValue(item.source_payload, "Categoria") as string | null) ??
    null
  );
}

function getDisplayTipo(item: LicitacionWithTracking) {
  return (
    (getSourcePayloadValue(item.source_payload, "Tipo") as string | null) ??
    (getSourcePayloadValue(item.source_payload, "CodigoTipo") as string | null) ??
    null
  );
}

function getDisplayMoneda(item: LicitacionWithTracking) {
  return (
    item.moneda ??
    (getSourcePayloadValue(item.source_payload, "Moneda") as string | null) ??
    null
  );
}

function getDisplayModalidad(item: LicitacionWithTracking) {
  return (
    (getSourcePayloadValue(item.source_payload, "Modalidad") as string | null) ??
    (getSourcePayloadValue(item.source_payload, "TipoPago") as string | null) ??
    null
  );
}

function getDisplayTiempo(item: LicitacionWithTracking) {
  const tiempo = getSourcePayloadValue(item.source_payload, "Tiempo");
  const unidadTiempo =
    (getSourcePayloadValue(item.source_payload, "UnidadTiempo") as string | number | null) ??
    (getSourcePayloadValue(item.source_payload, "UnidadTiempoDuracionContrato") as
      | string
      | number
      | null);

  if (!tiempo && !unidadTiempo) {
    return null;
  }

  return [tiempo, unidadTiempo].filter(Boolean).join(" ");
}

function getDisplayVisitaTerreno(item: LicitacionWithTracking) {
  return (
    (getSourcePayloadValue(item.source_payload, "FechaVisitaTerreno") as string | null) ??
    (getNestedSourcePayloadValue(item.source_payload, "Fechas", "FechaVisitaTerreno") as
      | string
      | null) ??
    null
  );
}

function getDisplayDireccionVisita(item: LicitacionWithTracking) {
  return (
    (getSourcePayloadValue(item.source_payload, "DireccionVisita") as string | null) ?? null
  );
}

function getDisplayDireccionEntrega(item: LicitacionWithTracking) {
  return (
    (getSourcePayloadValue(item.source_payload, "DireccionEntrega") as string | null) ?? null
  );
}

function getDisplayObras(item: LicitacionWithTracking) {
  const obras = getSourcePayloadValue(item.source_payload, "Obras");

  if (obras == null) {
    return null;
  }

  return String(obras);
}

function getKeywordMatches(item: LicitacionWithTracking, keywords: string[]) {
  if (keywords.length === 0) {
    return [];
  }

  const haystack = normalizeText(
    [
      item.codigo_licitacion,
      item.titulo,
      item.descripcion,
      item.organismo,
      item.comprador,
      item.categoria,
      getDisplayRegion(item),
    ]
      .filter(Boolean)
      .join(" "),
  );

  return keywords.filter((keyword) => haystack.includes(keyword));
}

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

function getDaysLeft(value: string | null) {
  if (!value) {
    return null;
  }

  const closeAt = new Date(value).getTime();

  if (Number.isNaN(closeAt)) {
    return null;
  }

  const diff = closeAt - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDaysLeft(value: string | null) {
  const days = getDaysLeft(value);

  if (days == null) {
    return "Sin dato";
  }

  if (days < 0) {
    return `Cerrada hace ${Math.abs(days)} d`;
  }

  if (days === 0) {
    return "Cierra hoy";
  }

  if (days === 1) {
    return "1 dia";
  }

  return `${days} dias`;
}

function compareValues(
  left: string | number | null,
  right: string | number | null,
  direction: SortState["direction"],
) {
  const leftValue = left ?? "";
  const rightValue = right ?? "";

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
  }

  const comparison = String(leftValue).localeCompare(String(rightValue), "es", {
    numeric: true,
    sensitivity: "base",
  });

  return direction === "asc" ? comparison : -comparison;
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
  const [sort, setSort] = useState<SortState>({
    key: "fecha_cierre",
    direction: "asc",
  });
  const [keywordsText, setKeywordsText] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_KEYWORDS_TEXT;
    }

    return window.localStorage.getItem(KEYWORDS_TEXT_STORAGE_KEY) ?? DEFAULT_KEYWORDS_TEXT;
  });
  const [keywordsEnabled, setKeywordsEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(KEYWORDS_ENABLED_STORAGE_KEY) === "true";
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(KEYWORDS_TEXT_STORAGE_KEY, keywordsText);
  }, [keywordsText]);

  useEffect(() => {
    window.localStorage.setItem(KEYWORDS_ENABLED_STORAGE_KEY, String(keywordsEnabled));
  }, [keywordsEnabled]);

  const parsedKeywords = useMemo(() => parseKeywordText(keywordsText), [keywordsText]);

  const filteredItems = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return items.filter((item) => {
      const stage = drafts[item.id]?.stage ?? "sin_revisar";

      if (stage === "descartada" && filters.stage !== "descartada") {
        return false;
      }

      if (filters.stage !== "todas" && stage !== filters.stage) {
        return false;
      }

      if (keywordsEnabled && getKeywordMatches(item, parsedKeywords).length === 0) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        item.codigo_licitacion,
        item.titulo,
        getDisplayOrganismo(item),
        getDisplayUnidad(item),
        getDisplayRegion(item),
        getDisplayCategoria(item),
        getDisplayTipo(item),
        getDisplayDireccionEntrega(item),
        getDisplayDireccionVisita(item),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [drafts, filters, items, keywordsEnabled, parsedKeywords]);

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

  const keywordMatchedCount = useMemo(() => {
    return items.reduce((count, item) => {
      return count + (getKeywordMatches(item, parsedKeywords).length > 0 ? 1 : 0);
    }, 0);
  }, [items, parsedKeywords]);

  async function saveTracking(id: string, stage: LicitacionTrackingStage) {
    const previousStage = drafts[id]?.stage ?? "sin_revisar";

    setDrafts((current) => ({
      ...current,
      [id]: { stage },
    }));
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
          stage,
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
      setMessage(`Accion actualizada a ${getStageLabel(stage).toLowerCase()}.`);
    } catch (caughtError) {
      setDrafts((current) => ({
        ...current,
        [id]: { stage: previousStage },
      }));
      setError(
        caughtError instanceof Error ? caughtError.message : "No se pudo guardar la accion.",
      );
    } finally {
      setSavingId(null);
    }
  }

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((left, right) => {
      switch (sort.key) {
        case "codigo_licitacion":
          return compareValues(left.codigo_licitacion, right.codigo_licitacion, sort.direction);
        case "titulo":
          return compareValues(left.titulo, right.titulo, sort.direction);
        case "region":
          return compareValues(getDisplayRegion(left), getDisplayRegion(right), sort.direction);
        case "monto_estimado":
          return compareValues(getDisplayAmount(left), getDisplayAmount(right), sort.direction);
        case "dias_restantes":
          return compareValues(
            getDaysLeft(left.fecha_cierre),
            getDaysLeft(right.fecha_cierre),
            sort.direction,
          );
        case "fecha_cierre":
        default:
          return compareValues(left.fecha_cierre, right.fecha_cierre, sort.direction);
      }
    });
  }, [filteredItems, sort]);

  function toggleSort(key: SortKey) {
    setSort((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: key === "fecha_cierre" || key === "dias_restantes" ? "asc" : "desc",
      };
    });
  }

  function getSortLabel(key: SortKey) {
    if (sort.key !== key) {
      return "↕";
    }

    return sort.direction === "asc" ? "↑" : "↓";
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

        <div className="mt-4 grid gap-4 lg:grid-cols-[auto_1fr]">
          <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={keywordsEnabled}
              onChange={(event) => setKeywordsEnabled(event.target.checked)}
            />
            Usar keywords como filtro
          </label>

          <div className="rounded-2xl border border-stone-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                Keywords editables
              </p>
              <p className="text-xs text-stone-500">
                {parsedKeywords.length} configuradas · {keywordMatchedCount} con match
              </p>
            </div>
            <textarea
              value={keywordsText}
              onChange={(event) => setKeywordsText(event.target.value)}
              rows={5}
              placeholder="Una keyword por linea o separadas por coma"
              className="mt-3 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
            />
          </div>
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
          <table className="min-w-[2200px] border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-[0.28em] text-stone-500">
                <th className="px-5 py-4">
                  <button type="button" onClick={() => toggleSort("codigo_licitacion")}>
                    Codigo {getSortLabel("codigo_licitacion")}
                  </button>
                </th>
                <th className="px-5 py-4">
                  <button type="button" onClick={() => toggleSort("titulo")}>
                    Nombre {getSortLabel("titulo")}
                  </button>
                </th>
                <th className="px-5 py-4">
                  <button type="button" onClick={() => toggleSort("region")}>
                    Organismo/Unidad {getSortLabel("region")}
                  </button>
                </th>
                <th className="px-5 py-4">
                  <button type="button" onClick={() => toggleSort("monto_estimado")}>
                    Monto {getSortLabel("monto_estimado")}
                  </button>
                </th>
                <th className="px-5 py-4">
                  <button type="button" onClick={() => toggleSort("fecha_cierre")}>
                    Cierre {getSortLabel("fecha_cierre")}
                  </button>
                </th>
                <th className="px-5 py-4">
                  <button type="button" onClick={() => toggleSort("dias_restantes")}>
                    Dias {getSortLabel("dias_restantes")}
                  </button>
                </th>
                <th className="px-5 py-4">Accion</th>
                <th className="px-5 py-4">Categoria</th>
                <th className="px-5 py-4">Tipo</th>
                <th className="px-5 py-4">Moneda</th>
                <th className="px-5 py-4">Modalidad</th>
                <th className="px-5 py-4">Tiempo</th>
                <th className="px-5 py-4">Visita Terreno</th>
                <th className="px-5 py-4">Dir. Visita</th>
                <th className="px-5 py-4">Dir. Entrega</th>
                <th className="px-5 py-4">Obras</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-6 py-14 text-center text-sm text-stone-500">
                    No hay licitaciones para los filtros actuales.
                  </td>
                </tr>
              ) : null}

              {sortedItems.map((item) => {
                const draft = drafts[item.id] ?? createDraft(item);
                const keywordMatches = getKeywordMatches(item, parsedKeywords);

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
                        {keywordMatches.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {keywordMatches.slice(0, 3).map((keyword) => (
                              <span
                                key={`${item.id}-${keyword}`}
                                className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700"
                              >
                                {keyword}
                              </span>
                            ))}
                            {keywordMatches.length > 3 ? (
                              <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium text-stone-600">
                                +{keywordMatches.length - 3}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
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
                      <div className="space-y-1">
                        <p>{getDisplayOrganismo(item) ?? "Sin organismo"}</p>
                        <p className="text-xs text-stone-500">
                          {getDisplayUnidad(item) ?? "Sin unidad"}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {formatClp(getDisplayAmount(item))}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {formatDate(item.fecha_cierre)}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {formatDaysLeft(item.fecha_cierre)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {LICITACION_TRACKING_STAGES.map((stage) => {
                          const active = draft.stage === stage;
                          const isSavingThisStage = savingId === item.id && active;

                          return (
                            <button
                              key={stage}
                              type="button"
                              onClick={() => saveTracking(item.id, stage)}
                              disabled={savingId === item.id}
                              className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                                active
                                  ? getStageBadge(stage)
                                  : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                              } ${savingId === item.id ? "cursor-not-allowed opacity-70" : ""}`}
                            >
                              {isSavingThisStage ? "Guardando..." : getStageLabel(stage)}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {getDisplayCategoria(item) ?? "Sin dato"}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {getDisplayTipo(item) ?? "Sin dato"}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {getDisplayMoneda(item) ?? "Sin dato"}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {getDisplayModalidad(item) ?? "Sin dato"}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {getDisplayTiempo(item) ?? "Sin dato"}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {formatDate(getDisplayVisitaTerreno(item))}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {getDisplayDireccionVisita(item) ?? "Sin dato"}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {getDisplayDireccionEntrega(item) ?? "Sin dato"}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {getDisplayObras(item) ?? "Sin dato"}
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
