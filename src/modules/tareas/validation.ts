import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type CreateTaskInput,
  type TaskPriority,
  type TaskStatus,
  type UpdateTaskInput,
} from "@/modules/tareas/types";

type ValidationSuccess<T> = {
  ok: true;
  data: T;
};

type ValidationFailure = {
  ok: false;
  error: string;
};

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalTrimmedText(value: unknown) {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredTrimmedText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseStatus(value: unknown): TaskStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  return TASK_STATUSES.includes(value as TaskStatus)
    ? (value as TaskStatus)
    : null;
}

function parsePriority(value: unknown): TaskPriority | null {
  if (typeof value !== "string") {
    return null;
  }

  return TASK_PRIORITIES.includes(value as TaskPriority)
    ? (value as TaskPriority)
    : null;
}

function parseDate(value: unknown) {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function validateCreateTaskInput(payload: unknown): ValidationResult<CreateTaskInput> {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "El cuerpo de la solicitud es inválido." };
  }

  const titulo = requiredTrimmedText(payload.titulo);
  if (!titulo) {
    return { ok: false, error: "El título es obligatorio." };
  }

  const estado =
    payload.estado == null ? "pendiente" : parseStatus(payload.estado);
  if (!estado) {
    return { ok: false, error: "El estado no es válido." };
  }

  const prioridad =
    payload.prioridad == null ? "media" : parsePriority(payload.prioridad);
  if (!prioridad) {
    return { ok: false, error: "La prioridad no es válida." };
  }

  const fecha_limite =
    payload.fecha_limite == null ? null : parseDate(payload.fecha_limite);
  if (payload.fecha_limite != null && fecha_limite == null) {
    return { ok: false, error: "La fecha límite debe usar formato YYYY-MM-DD." };
  }

  return {
    ok: true,
    data: {
      titulo,
      descripcion: optionalTrimmedText(payload.descripcion) ?? undefined,
      estado,
      prioridad,
      categoria: optionalTrimmedText(payload.categoria) ?? undefined,
      fecha_limite: fecha_limite ?? undefined,
    },
  };
}

export function validateUpdateTaskInput(payload: unknown): ValidationResult<UpdateTaskInput> {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "El cuerpo de la solicitud es inválido." };
  }

  const data: UpdateTaskInput = {};
  let touched = false;

  if ("titulo" in payload) {
    touched = true;
    const titulo = requiredTrimmedText(payload.titulo);
    if (!titulo) {
      return { ok: false, error: "El título no puede estar vacío." };
    }
    data.titulo = titulo;
  }

  if ("descripcion" in payload) {
    touched = true;
    data.descripcion = optionalTrimmedText(payload.descripcion) ?? "";
  }

  if ("categoria" in payload) {
    touched = true;
    data.categoria = optionalTrimmedText(payload.categoria) ?? "";
  }

  if ("estado" in payload) {
    touched = true;
    const estado = parseStatus(payload.estado);
    if (!estado) {
      return { ok: false, error: "El estado no es válido." };
    }
    data.estado = estado;
  }

  if ("prioridad" in payload) {
    touched = true;
    const prioridad = parsePriority(payload.prioridad);
    if (!prioridad) {
      return { ok: false, error: "La prioridad no es válida." };
    }
    data.prioridad = prioridad;
  }

  if ("fecha_limite" in payload) {
    touched = true;
    if (payload.fecha_limite === "" || payload.fecha_limite == null) {
      data.fecha_limite = "";
    } else {
      const fecha_limite = parseDate(payload.fecha_limite);
      if (!fecha_limite) {
        return {
          ok: false,
          error: "La fecha límite debe usar formato YYYY-MM-DD.",
        };
      }
      data.fecha_limite = fecha_limite;
    }
  }

  if (!touched) {
    return { ok: false, error: "No se enviaron cambios." };
  }

  return { ok: true, data };
}
