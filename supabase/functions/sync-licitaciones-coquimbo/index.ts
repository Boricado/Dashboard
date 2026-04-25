import { createClient } from "npm:@supabase/supabase-js@2.49.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const MP_BASE_URL =
  Deno.env.get("MP_BASE_URL") ?? "https://api.mercadopublico.cl/servicios/v1/publico";
const MERCADO_PUBLICO_TICKET =
  Deno.env.get("MERCADO_PUBLICO_TICKET") ??
  Deno.env.get("MP_API_KEY") ??
  "";

const REGION_PRIORITY = (Deno.env.get("REGION_PRIORITY") ?? "coquimbo").trim().toLowerCase();
const KEYWORD_FILTERS = (
  Deno.env.get("KEYWORD_FILTERS") ??
  [
    "constructor civil",
    "ingeniero constructor",
    "ingeniero en construccion",
    "ingeniero en construcción",
    "topografia",
    "topografía",
    "topografico",
    "topográfico",
    "levantamiento topografico",
    "levantamiento topográfico",
    "levantamientos topograficos",
    "levantamientos topográficos",
    "geomensura",
    "geomensor",
    "geomensores",
    "geodesia",
    "geodesico",
    "geodésico",
    "levantamiento georreferenciado",
    "inspeccion tecnica",
    "inspección técnica",
    "inspeccion tecnica de obras",
    "inspección técnica de obras",
    "ito",
    "asesoria tecnica",
    "asesoría técnica",
    "asistencia tecnica",
    "asistencia técnica",
    "ato",
    "auditoria tecnica",
    "auditoría técnica",
    "revision de proyectos",
    "revisión de proyectos",
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
    "movimientos de tierra",
    "cubicacion",
    "cubicación",
    "presupuesto de obra",
    "programacion de obra",
    "programación de obra",
    "licitacion de obra",
    "licitación de obra",
    "diseño estructural",
    "diseno estructural",
    "ingenieria estructural",
    "ingeniería estructural",
    "regularizacion",
    "regularización",
    "subdivision",
    "subdivisión",
    "loteo",
    "mensura",
    "levantamiento planimetrico",
    "levantamiento planimétrico",
    "levantamiento altimetrico",
    "levantamiento altimétrico",
    "nivelacion topografica",
    "nivelación topográfica",
    "trazado topografico",
    "trazado topográfico",
    "batimetria",
    "batimetría",
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
    "ti",
    "soporte informatico",
    "soporte informático",
    "redes y comunicaciones",
    "ciberseguridad",
    "transformacion digital",
    "transformación digital",
    "plataforma web",
  ].join(",")
)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const INITIAL_SYNC_DAYS = Number(Deno.env.get("INITIAL_SYNC_DAYS") ?? "7");
const REQUEST_DELAY_MS = Number(Deno.env.get("REQUEST_DELAY_MS") ?? "1500");
const RETRY_DELAY_MS = Number(Deno.env.get("RETRY_DELAY_MS") ?? "3500");
const MAX_RETRIES_PER_DAY = Number(Deno.env.get("MAX_RETRIES_PER_DAY") ?? "4");
const SYNC_KEY = "licitaciones_mp";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
}

if (!MERCADO_PUBLICO_TICKET) {
  throw new Error("Falta MERCADO_PUBLICO_TICKET.");
}

type MercadoPublicoItem = {
  CodigoExterno?: string;
  Nombre?: string;
  Descripcion?: string;
  MontoEstimado?: number | string | null;
  Moneda?: string | null;
  CodigoEstado?: number | string | null;
  FechaCreacion?: string | null;
  FechaCierre?: string | null;
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

type LicitacionUpsert = {
  codigo_licitacion: string;
  titulo: string;
  descripcion: string | null;
  monto_estimado: number | null;
  moneda: string | null;
  region: string | null;
  estado_api: string;
  codigo_estado: string;
  fecha_publicacion: string | null;
  fecha_cierre: string | null;
  organismo: string | null;
  comprador: string | null;
  categoria: string | null;
  url: string | null;
  source_payload: MercadoPublicoItem;
  last_synced_at: string;
};

type SyncStateRow = {
  sync_key: string;
  last_success_at: string | null;
  last_run_at: string | null;
  last_result: Record<string, unknown> | null;
  updated_at: string;
};

const ESTADO_PUBLICADA = "5";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatApiDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}${month}${year}`;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }

  return null;
}

function parseDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function extractItems(payload: Record<string, unknown>): MercadoPublicoItem[] {
  if (Array.isArray(payload.Listado)) {
    return payload.Listado as MercadoPublicoItem[];
  }

  if (
    payload.data &&
    typeof payload.data === "object" &&
    Array.isArray((payload.data as { Listado?: unknown[] }).Listado)
  ) {
    return (payload.data as { Listado: MercadoPublicoItem[] }).Listado;
  }

  return [];
}

function normalizeRegion(item: MercadoPublicoItem): string | null {
  return item.Comprador?.RegionUnidad?.trim() ?? null;
}

function isPriorityRegion(item: MercadoPublicoItem): boolean {
  const region = normalizeText(normalizeRegion(item));
  return REGION_PRIORITY ? region.includes(normalizeText(REGION_PRIORITY)) : false;
}

function matchesKeywords(item: MercadoPublicoItem): boolean {
  const haystack = normalizeText(
    [
      item.Nombre,
      item.Descripcion,
      item.Categoria,
      item.Comprador?.NombreOrganismo,
      item.Comprador?.NombreUnidad,
    ]
      .filter(Boolean)
      .join(" "),
  );

  return KEYWORD_FILTERS.some((keyword) => haystack.includes(normalizeText(keyword)));
}

function hasUsefulClosure(item: MercadoPublicoItem): boolean {
  const closeAt = parseDate(item.FechaCierre ?? item.Fechas?.FechaCierre);
  if (!closeAt) return false;
  return new Date(closeAt).getTime() >= Date.now() - 60 * 60 * 1000;
}

function shouldKeep(item: MercadoPublicoItem): boolean {
  const code = item.CodigoExterno?.trim();
  const title = item.Nombre?.trim();
  const closeAt = parseDate(item.FechaCierre ?? item.Fechas?.FechaCierre);

  if (!code || !title || !closeAt) {
    return false;
  }
  return true;
}

function mapToUpsert(item: MercadoPublicoItem): LicitacionUpsert | null {
  const code = item.CodigoExterno?.trim();
  const title = item.Nombre?.trim();
  const closeAt = parseDate(item.FechaCierre ?? item.Fechas?.FechaCierre);

  if (!code || !title || !closeAt) {
    return null;
  }

  return {
    codigo_licitacion: code,
    titulo: title,
    descripcion: item.Descripcion?.trim() || null,
    monto_estimado: parseNumber(item.MontoEstimado),
    moneda: item.Moneda?.trim() || null,
    region: normalizeRegion(item),
    estado_api: "publicada",
    codigo_estado: String(item.CodigoEstado ?? ESTADO_PUBLICADA),
    fecha_publicacion: parseDate(item.Fechas?.FechaPublicacion ?? item.FechaCreacion),
    fecha_cierre: closeAt,
    organismo: item.Comprador?.NombreOrganismo?.trim() || null,
    comprador: item.Comprador?.NombreUnidad?.trim() || null,
    categoria: item.Categoria?.trim() || null,
    url: item.UrlFicha?.trim() || null,
    source_payload: item,
    last_synced_at: new Date().toISOString(),
  };
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dateDiffInDays(from: Date, to: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay));
}

async function getSyncState(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("sync_state")
    .select("*")
    .eq("sync_key", SYNC_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer sync_state: ${error.message}`);
  }

  return (data ?? null) as SyncStateRow | null;
}

async function setSyncState(
  supabase: ReturnType<typeof createClient>,
  patch: Partial<SyncStateRow>,
) {
  const { error } = await supabase.from("sync_state").upsert(
    {
      sync_key: SYNC_KEY,
      ...patch,
    },
    { onConflict: "sync_key" },
  );

  if (error) {
    throw new Error(`No se pudo actualizar sync_state: ${error.message}`);
  }
}

async function fetchByDateOnce(date: Date): Promise<MercadoPublicoItem[]> {
  const url = new URL(`${MP_BASE_URL}/licitaciones.json`);
  url.searchParams.set("fecha", formatApiDate(date));
  url.searchParams.set("estado", "publicada");
  url.searchParams.set("ticket", MERCADO_PUBLICO_TICKET);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `MercadoPublico fecha fallo: ${response.status} ${response.statusText}. Body: ${text}`,
    );
  }

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`MercadoPublico fecha devolvio texto no JSON: ${text}`);
  }

  return extractItems(json);
}

async function fetchByDateWithRetry(date: Date): Promise<MercadoPublicoItem[]> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < MAX_RETRIES_PER_DAY) {
    try {
      return await fetchByDateOnce(date);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const isTooManyRequests = message.includes("429");

      if (!isTooManyRequests) {
        throw error;
      }

      attempt += 1;

      if (attempt >= MAX_RETRIES_PER_DAY) {
        break;
      }

      console.warn(
        `429 en ${formatApiDate(date)}. Reintento ${attempt}/${MAX_RETRIES_PER_DAY} tras ${RETRY_DELAY_MS}ms`,
      );
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function runSync() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  await setSyncState(supabase, {
    last_run_at: new Date().toISOString(),
  });

  const state = await getSyncState(supabase);

  const now = new Date();
  let startDate: Date;

  if (state?.last_success_at) {
    startDate = new Date(state.last_success_at);
    startDate.setDate(startDate.getDate() - 1);
  } else {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - INITIAL_SYNC_DAYS);
  }

  const scannedDays = dateDiffInDays(startDate, now);
  const failedDates: string[] = [];
  const rawItems: MercadoPublicoItem[] = [];

  for (let offset = 0; offset <= scannedDays; offset += 1) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + offset);

    try {
      const dayItems = await fetchByDateWithRetry(currentDate);
      rawItems.push(...dayItems);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Dia omitido ${formatApiDate(currentDate)}: ${message}`);
      failedDates.push(formatApiDate(currentDate));
    }

    await sleep(REQUEST_DELAY_MS);
  }

  const deduped = new Map<string, MercadoPublicoItem>();
  let priorityRegionCount = 0;
  let keywordMatchCount = 0;

  for (const item of rawItems) {
    const code = item.CodigoExterno?.trim();
    if (!code) continue;
    if (!hasUsefulClosure(item)) continue;
    if (!shouldKeep(item)) continue;
    if (isPriorityRegion(item)) {
      priorityRegionCount += 1;
    }
    if (matchesKeywords(item)) {
      keywordMatchCount += 1;
    }
    deduped.set(code, item);
  }

  const mapped = Array.from(deduped.values())
    .map(mapToUpsert)
    .filter((row): row is LicitacionUpsert => Boolean(row));

  if (mapped.length > 0) {
    const { error } = await supabase
      .from("licitaciones")
      .upsert(mapped, { onConflict: "codigo_licitacion" });

    if (error) {
      throw new Error(`Supabase upsert fallo: ${error.message}`);
    }
  }

  const { error: closeError } = await supabase
    .from("licitaciones")
    .update({ estado_api: "cerrada" })
    .lt("fecha_cierre", new Date().toISOString())
    .eq("estado_api", "publicada");

  if (closeError) {
    throw new Error(`Supabase cierre fallo: ${closeError.message}`);
  }

  const result = {
    total_fetched: rawItems.length,
    total_kept: mapped.length,
    scanned_days: scannedDays,
    region_priority: REGION_PRIORITY,
    keyword_count: KEYWORD_FILTERS.length,
    matched_priority_region: priorityRegionCount,
    matched_keywords: keywordMatchCount,
    from_last_success: Boolean(state?.last_success_at),
    last_success_at_before: state?.last_success_at ?? null,
    failed_dates: failedDates,
  };

  await setSyncState(supabase, {
    last_success_at: new Date().toISOString(),
    last_result: result,
  });

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await runSync();
    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("sync-licitaciones-coquimbo error:", message);

    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
