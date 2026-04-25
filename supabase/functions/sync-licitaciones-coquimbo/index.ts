import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

type MercadoPublicoItem = {
  CodigoExterno?: string;
  Nombre?: string;
  Descripcion?: string;
  MontoEstimado?: number | string | null;
  Moneda?: string | null;
  FechaCreacion?: string | null;
  Fechas?: {
    FechaPublicacion?: string | null;
    FechaCierre?: string | null;
  } | null;
  Comprador?: {
    NombreOrganismo?: string | null;
    NombreUnidad?: string | null;
    RegionUnidad?: string | null;
  } | null;
  Categoria?: string | null;
  UrlFicha?: string | null;
};

const REGION_TARGET = "coquimbo";
const ESTADO_PUBLICADA = "5";
const MAX_AMOUNT_CLP = Number(Deno.env.get("SYNC_MAX_AMOUNT_CLP") ?? "10000000");
const WINDOW_DAYS = Number(Deno.env.get("SYNC_WINDOW_DAYS") ?? "45");
const MP_BASE_URL = Deno.env.get("MP_BASE_URL") ?? "https://api.mercadopublico.cl/servicios/v1/publico";
const MP_API_KEY =
  Deno.env.get("MERCADO_PUBLICO_TICKET") ??
  Deno.env.get("MP_API_KEY") ??
  "";
const MP_ORGANISM_CODE =
  Deno.env.get("CODIGO_ORGANISMO") ??
  Deno.env.get("MP_CODIGO_ORGANISMO") ??
  "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function formatApiDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}${month}${year}`;
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const digits = value.replace(/[^\d.-]/g, "");
    if (!digits) {
      return null;
    }

    const parsed = Number(digits);
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }

  return null;
}

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function extractItems(payload: Record<string, unknown>) {
  const direct = payload.Listado;
  if (Array.isArray(direct)) {
    return direct as MercadoPublicoItem[];
  }

  const nested = payload.data;
  if (nested && typeof nested === "object" && Array.isArray((nested as { Listado?: unknown[] }).Listado)) {
    return (nested as { Listado: MercadoPublicoItem[] }).Listado;
  }

  return [];
}

async function fetchOneDay(date: Date) {
  const url = new URL(`${MP_BASE_URL}/licitaciones.json`);
  url.searchParams.set("fecha", formatApiDate(date));
  url.searchParams.set("estado", ESTADO_PUBLICADA);
  url.searchParams.set("ticket", MP_API_KEY);
  if (MP_ORGANISM_CODE) {
    url.searchParams.set("CodigoOrganismo", MP_ORGANISM_CODE);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mercado Publico respondio ${response.status}: ${text}`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  return extractItems(json);
}

async function fetchActivas() {
  const url = new URL(`${MP_BASE_URL}/licitaciones.json`);
  url.searchParams.set("estado", "activas");
  url.searchParams.set("ticket", MP_API_KEY);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mercado Publico respondio ${response.status}: ${text}`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  return extractItems(json);
}

function normalizeRegion(item: MercadoPublicoItem) {
  return item.Comprador?.RegionUnidad?.trim() ?? null;
}

function isTargetRegion(item: MercadoPublicoItem) {
  const region = normalizeRegion(item)?.toLowerCase() ?? "";
  return region.includes(REGION_TARGET);
}

function isUnderBudget(item: MercadoPublicoItem) {
  const amount = parseNumber(item.MontoEstimado);
  const currency = (item.Moneda ?? "CLP").toUpperCase();

  if (amount == null) {
    return false;
  }

  if (currency !== "CLP") {
    return false;
  }

  return amount <= MAX_AMOUNT_CLP;
}

function isStillActive(item: MercadoPublicoItem) {
  const closeAt = parseDate(item.Fechas?.FechaCierre);

  if (!closeAt) {
    return false;
  }

  return new Date(closeAt).getTime() >= Date.now() - 60 * 60 * 1000;
}

function mapRow(item: MercadoPublicoItem) {
  return {
    codigo_licitacion: item.CodigoExterno?.trim() ?? "",
    titulo: item.Nombre?.trim() ?? "Licitacion sin nombre",
    descripcion: item.Descripcion?.trim() || null,
    monto_estimado: parseNumber(item.MontoEstimado),
    moneda: item.Moneda?.trim() || "CLP",
    region: normalizeRegion(item),
    estado_api: "publicada",
    codigo_estado: ESTADO_PUBLICADA,
    fecha_publicacion: parseDate(item.Fechas?.FechaPublicacion ?? item.FechaCreacion),
    fecha_cierre: parseDate(item.Fechas?.FechaCierre),
    organismo: item.Comprador?.NombreOrganismo?.trim() || null,
    comprador: item.Comprador?.NombreUnidad?.trim() || null,
    categoria: item.Categoria?.trim() || null,
    url: item.UrlFicha?.trim() || null,
    source_payload: item,
    last_synced_at: new Date().toISOString(),
  };
}

Deno.serve(async () => {
  try {
    const rawItems = MP_ORGANISM_CODE
      ? (
          await Promise.all(
            Array.from({ length: WINDOW_DAYS }, (_, index) => {
              const date = new Date();
              date.setDate(date.getDate() - index);
              return fetchOneDay(date);
            }),
          )
        ).flat()
      : await fetchActivas();
    const byCode = new Map<string, MercadoPublicoItem>();

    for (const item of rawItems) {
      const code = item.CodigoExterno?.trim();

      if (!code) {
        continue;
      }

      if (!isTargetRegion(item) || !isUnderBudget(item) || !isStillActive(item)) {
        continue;
      }

      byCode.set(code, item);
    }

    const rows = Array.from(byCode.values()).map(mapRow);

    if (rows.length > 0) {
      const { error } = await supabase
        .from("licitaciones")
        .upsert(rows, { onConflict: "codigo_licitacion" });

      if (error) {
        throw new Error(error.message);
      }
    }

    const { error: closeError } = await supabase
      .from("licitaciones")
      .update({ estado_api: "cerrada" })
      .lt("fecha_cierre", new Date().toISOString())
      .eq("estado_api", "publicada");

    if (closeError) {
      throw new Error(closeError.message);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        scanned_days: MP_ORGANISM_CODE ? WINDOW_DAYS : 1,
        organism_code: MP_ORGANISM_CODE || null,
        fetched_rows: rawItems.length,
        kept_rows: rows.length,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo sincronizar.";

    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
});
