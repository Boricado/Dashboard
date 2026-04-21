import { TasksClient } from "@/modules/tareas/TasksClient";
import { listTasks } from "@/modules/tareas/data";
import type { TaskRecord } from "@/modules/tareas/types";

export default async function TareasPage() {
  let tasks: TaskRecord[] = [];
  let initialError: string | null = null;

  try {
    tasks = await listTasks();
  } catch (error) {
    initialError =
      error instanceof Error ? error.message : "No se pudieron cargar las tareas.";
  }

  return (
    <TasksClient
      initialTasks={tasks}
      initialError={
        initialError
          ? `La tabla o políticas de tareas todavía no están activas en Supabase: ${initialError}`
          : null
      }
    />
  );
}
