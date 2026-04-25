import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  LicitacionRecord,
  LicitacionTrackingInput,
  LicitacionTrackingRecord,
  LicitacionesPageData,
  LicitacionWithTracking,
} from "@/modules/licitaciones/types";

type TrackingJoin = LicitacionTrackingRecord[] | LicitacionTrackingRecord | null;

const FALLBACK_ITEMS: LicitacionWithTracking[] = [
  {
    id: "local-licitacion-1",
    codigo_licitacion: "2716-12-LQ26",
    titulo: "Mantencion y mejoramiento de espacios comunitarios",
    descripcion: "Ejemplo local mientras se conecta el cron real.",
    monto_estimado: 7800000,
    moneda: "CLP",
    region: "Región de Coquimbo",
    estado_api: "publicada",
    codigo_estado: "5",
    fecha_publicacion: "2026-04-22T10:00:00.000Z",
    fecha_cierre: "2026-04-30T15:00:00.000Z",
    organismo: "Municipalidad de Coquimbo",
    comprador: "SECPLAN",
    categoria: "Obras menores",
    url: "https://www.mercadopublico.cl/",
    last_synced_at: "2026-04-25T11:30:00.000Z",
    created_at: "2026-04-25T11:30:00.000Z",
    updated_at: "2026-04-25T11:30:00.000Z",
    tracking: {
      id: "local-track-1",
      licitacion_id: "local-licitacion-1",
      user_id: "local-user",
      stage: "revisada",
      priority: "alta",
      next_step: "Revisar bases tecnicas y visita a terreno",
      notes: "El monto calza con el filtro de menos de 10 MM.",
      follow_up_at: "2026-04-28T14:00:00.000Z",
      is_favorite: true,
      hidden: false,
      created_at: "2026-04-25T11:30:00.000Z",
      updated_at: "2026-04-25T11:30:00.000Z",
    },
  },
  {
    id: "local-licitacion-2",
    codigo_licitacion: "4389-8-LE26",
    titulo: "Suministro de piezas metalicas para reparaciones",
    descripcion: null,
    monto_estimado: 4200000,
    moneda: "CLP",
    region: "Región de Coquimbo",
    estado_api: "publicada",
    codigo_estado: "5",
    fecha_publicacion: "2026-04-21T09:00:00.000Z",
    fecha_cierre: "2026-05-02T18:00:00.000Z",
    organismo: "Servicio Local de Educación",
    comprador: "Adquisiciones",
    categoria: "Suministros",
    url: "https://www.mercadopublico.cl/",
    last_synced_at: "2026-04-25T11:30:00.000Z",
    created_at: "2026-04-25T11:30:00.000Z",
    updated_at: "2026-04-25T11:30:00.000Z",
    tracking: null,
  },
];

function readTracking(joined: TrackingJoin) {
  if (Array.isArray(joined)) {
    return joined[0] ?? null;
  }

  return joined ?? null;
}

async function getLicitacionesContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay una sesion activa.");
  }

  return { supabase, userId: user.id };
}

export function getLicitacionesFallbackData(): LicitacionesPageData {
  return {
    items: FALLBACK_ITEMS,
    fetched_at: new Date().toISOString(),
  };
}

export async function getLicitacionesPageData(): Promise<LicitacionesPageData> {
  const { supabase } = await getLicitacionesContext();

  const { data, error } = await supabase
    .from("licitaciones")
    .select(
      "id, codigo_licitacion, titulo, descripcion, monto_estimado, moneda, region, estado_api, codigo_estado, fecha_publicacion, fecha_cierre, organismo, comprador, categoria, url, last_synced_at, created_at, updated_at, tracking:licitacion_tracking(id, licitacion_id, user_id, stage, priority, next_step, notes, follow_up_at, is_favorite, hidden, created_at, updated_at)",
    )
    .order("fecha_cierre", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items: LicitacionWithTracking[] = ((data ?? []) as Array<
    LicitacionRecord & { tracking: TrackingJoin }
  >).map((item) => ({
    ...item,
    tracking: readTracking(item.tracking),
  }));

  return {
    items,
    fetched_at: new Date().toISOString(),
  };
}

export async function upsertLicitacionTracking(
  licitacionId: string,
  input: LicitacionTrackingInput,
) {
  const { supabase, userId } = await getLicitacionesContext();

  const { data, error } = await supabase
    .from("licitacion_tracking")
    .upsert(
      {
        licitacion_id: licitacionId,
        user_id: userId,
        stage: input.stage,
        priority: input.priority ?? "media",
        next_step: input.next_step ?? null,
        notes: input.notes ?? null,
        follow_up_at: input.follow_up_at ?? null,
        is_favorite: input.is_favorite ?? false,
        hidden: input.hidden ?? false,
      },
      {
        onConflict: "user_id,licitacion_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as LicitacionTrackingRecord;
}
