export const TASK_STATUSES = [
  "pendiente",
  "en_progreso",
  "completada",
  "cancelada",
] as const;

export const TASK_PRIORITIES = [
  "baja",
  "media",
  "alta",
  "urgente",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type TaskRecord = {
  id: number;
  user_id: string;
  titulo: string;
  descripcion: string | null;
  estado: TaskStatus;
  prioridad: TaskPriority;
  categoria: string | null;
  fecha_limite: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTaskInput = {
  titulo: string;
  descripcion?: string;
  estado?: TaskStatus;
  prioridad?: TaskPriority;
  categoria?: string;
  fecha_limite?: string;
};

export type UpdateTaskInput = {
  titulo?: string;
  descripcion?: string;
  estado?: TaskStatus;
  prioridad?: TaskPriority;
  categoria?: string;
  fecha_limite?: string;
};
