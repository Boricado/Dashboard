import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CreateTaskInput,
  TaskRecord,
  UpdateTaskInput,
} from "@/modules/tareas/types";

const TASK_COLUMNS =
  "id, user_id, titulo, descripcion, estado, prioridad, categoria, fecha_limite, created_at, updated_at";

export async function listTasks() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TaskRecord[];
}

export async function createTask(input: CreateTaskInput) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay una sesión activa.");
  }

  const payload = {
    user_id: user.id,
    titulo: input.titulo,
    descripcion: input.descripcion ?? null,
    estado: input.estado ?? "pendiente",
    prioridad: input.prioridad ?? "media",
    categoria: input.categoria ?? null,
    fecha_limite: input.fecha_limite ?? null,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(payload)
    .select(TASK_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TaskRecord;
}

export async function updateTask(id: number, input: UpdateTaskInput) {
  const supabase = await createSupabaseServerClient();
  const payload: Record<string, string | null> = {};

  if (input.titulo != null) {
    payload.titulo = input.titulo;
  }
  if (input.descripcion != null) {
    payload.descripcion = input.descripcion || null;
  }
  if (input.estado != null) {
    payload.estado = input.estado;
  }
  if (input.prioridad != null) {
    payload.prioridad = input.prioridad;
  }
  if (input.categoria != null) {
    payload.categoria = input.categoria || null;
  }
  if (input.fecha_limite != null) {
    payload.fecha_limite = input.fecha_limite || null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", id)
    .select(TASK_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TaskRecord;
}

export async function deleteTask(id: number) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
