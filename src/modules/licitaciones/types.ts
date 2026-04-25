export const LICITACION_TRACKING_STAGES = [
  "sin_revisar",
  "revisada",
  "postulada",
  "descartada",
] as const;

export const LICITACION_PRIORITY_LEVELS = [
  "baja",
  "media",
  "alta",
] as const;

export type LicitacionTrackingStage = (typeof LICITACION_TRACKING_STAGES)[number];
export type LicitacionPriorityLevel = (typeof LICITACION_PRIORITY_LEVELS)[number];

export type LicitacionRecord = {
  id: string;
  codigo_licitacion: string;
  titulo: string;
  descripcion: string | null;
  monto_estimado: number | null;
  moneda: string | null;
  region: string | null;
  estado_api: string | null;
  codigo_estado: string | null;
  fecha_publicacion: string | null;
  fecha_cierre: string | null;
  organismo: string | null;
  comprador: string | null;
  categoria: string | null;
  url: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LicitacionTrackingRecord = {
  id: string;
  licitacion_id: string;
  user_id: string;
  stage: LicitacionTrackingStage;
  priority: LicitacionPriorityLevel;
  next_step: string | null;
  notes: string | null;
  follow_up_at: string | null;
  is_favorite: boolean;
  hidden: boolean;
  created_at: string;
  updated_at: string;
};

export type LicitacionWithTracking = LicitacionRecord & {
  tracking: LicitacionTrackingRecord | null;
};

export type LicitacionesPageData = {
  items: LicitacionWithTracking[];
  fetched_at: string;
};

export type LicitacionTrackingInput = {
  stage: LicitacionTrackingStage;
  priority?: LicitacionPriorityLevel;
  next_step?: string;
  notes?: string;
  follow_up_at?: string | null;
  is_favorite?: boolean;
  hidden?: boolean;
};
