import {
  LICITACION_PRIORITY_LEVELS,
  LICITACION_TRACKING_STAGES,
  type LicitacionPriorityLevel,
  type LicitacionTrackingInput,
  type LicitacionTrackingStage,
} from "@/modules/licitaciones/types";

type ValidationResult =
  | { ok: true; data: LicitacionTrackingInput }
  | { ok: false; error: string };

function isStage(value: string): value is LicitacionTrackingStage {
  return LICITACION_TRACKING_STAGES.includes(value as LicitacionTrackingStage);
}

function isPriority(value: string): value is LicitacionPriorityLevel {
  return LICITACION_PRIORITY_LEVELS.includes(value as LicitacionPriorityLevel);
}

export function validateLicitacionTrackingInput(payload: unknown): ValidationResult {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Payload invalido." };
  }

  const data = payload as Record<string, unknown>;
  const stage = String(data.stage ?? "");
  const priority = String(data.priority ?? "");

  if (!isStage(stage)) {
    return { ok: false, error: "Etapa invalida." };
  }

  if (!isPriority(priority)) {
    return { ok: false, error: "Prioridad invalida." };
  }

  const nextStep = typeof data.next_step === "string" ? data.next_step.trim() : "";
  const notes = typeof data.notes === "string" ? data.notes.trim() : "";
  const followUpAt =
    typeof data.follow_up_at === "string" && data.follow_up_at.trim().length > 0
      ? data.follow_up_at
      : null;

  return {
    ok: true,
    data: {
      stage,
      priority,
      next_step: nextStep || undefined,
      notes: notes || undefined,
      follow_up_at: followUpAt,
      is_favorite: Boolean(data.is_favorite),
      hidden: Boolean(data.hidden),
    },
  };
}
