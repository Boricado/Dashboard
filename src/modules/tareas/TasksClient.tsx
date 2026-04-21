"use client";

import { useMemo, useState, useTransition } from "react";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type CreateTaskInput,
  type TaskPriority,
  type TaskRecord,
  type TaskStatus,
  type UpdateTaskInput,
} from "@/modules/tareas/types";

type TasksClientProps = {
  initialTasks: TaskRecord[];
  initialError?: string | null;
};

type Filters = {
  estado: "todas" | TaskStatus;
  prioridad: "todas" | TaskPriority;
  busqueda: string;
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
  cancelada: "Cancelada",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

const STATUS_TONE: Record<TaskStatus, string> = {
  pendiente: "bg-amber-100 text-amber-900",
  en_progreso: "bg-sky-100 text-sky-900",
  completada: "bg-emerald-100 text-emerald-900",
  cancelada: "bg-zinc-200 text-zinc-700",
};

const PRIORITY_TONE: Record<TaskPriority, string> = {
  baja: "bg-zinc-100 text-zinc-700",
  media: "bg-lime-100 text-lime-900",
  alta: "bg-orange-100 text-orange-900",
  urgente: "bg-rose-100 text-rose-900",
};

const EMPTY_FORM: CreateTaskInput = {
  titulo: "",
  descripcion: "",
  categoria: "",
  prioridad: "media",
  estado: "pendiente",
  fecha_limite: "",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as T | null;
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error?: string }).error ?? "Error inesperado")
        : "Error inesperado";
    throw new Error(message);
  }

  if (data == null) {
    throw new Error("Respuesta vacía.");
  }

  return data;
}

export function TasksClient({ initialTasks, initialError = null }: TasksClientProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [form, setForm] = useState<CreateTaskInput>(EMPTY_FORM);
  const [filters, setFilters] = useState<Filters>({
    estado: "todas",
    prioridad: "todas",
    busqueda: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.estado !== "todas" && task.estado !== filters.estado) {
        return false;
      }
      if (filters.prioridad !== "todas" && task.prioridad !== filters.prioridad) {
        return false;
      }
      if (!filters.busqueda.trim()) {
        return true;
      }

      const query = filters.busqueda.toLowerCase();
      return [task.titulo, task.descripcion ?? "", task.categoria ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [filters, tasks]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      pendientes: tasks.filter((task) => task.estado === "pendiente").length,
      enProgreso: tasks.filter((task) => task.estado === "en_progreso").length,
      completadas: tasks.filter((task) => task.estado === "completada").length,
    };
  }, [tasks]);

  function updateForm<K extends keyof CreateTaskInput>(key: K, value: CreateTaskInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await readJson<{ task: TaskRecord }>(response);
        setTasks((current) => [data.task, ...current]);
        setForm(EMPTY_FORM);
        setSuccess("Tarea creada.");
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : "No se pudo crear la tarea.",
        );
      }
    });
  }

  async function updateTask(taskId: number, patch: UpdateTaskInput, successMessage?: string) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await readJson<{ task: TaskRecord }>(response);
        setTasks((current) =>
          current.map((task) => (task.id === taskId ? data.task : task)),
        );
        setSuccess(successMessage ?? "Tarea actualizada.");
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : "No se pudo actualizar la tarea.",
        );
      }
    });
  }

  async function handleDeleteTask(taskId: number) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
        });
        await readJson<{ ok: true }>(response);
        setTasks((current) => current.filter((task) => task.id !== taskId));
        setSuccess("Tarea eliminada.");
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : "No se pudo eliminar la tarea.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6">
        <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Módulo activo
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Tareas</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Ya quedó conectado para crear, listar, editar estado y borrar tareas
          reales en Supabase, con validación en servidor y RLS por usuario.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="app-card p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Total
          </div>
          <div className="mt-2 text-3xl font-semibold">{stats.total}</div>
        </article>
        <article className="app-card p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Pendientes
          </div>
          <div className="mt-2 text-3xl font-semibold">{stats.pendientes}</div>
        </article>
        <article className="app-card p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            En progreso
          </div>
          <div className="mt-2 text-3xl font-semibold">{stats.enProgreso}</div>
        </article>
        <article className="app-card p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Completadas
          </div>
          <div className="mt-2 text-3xl font-semibold">{stats.completadas}</div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form onSubmit={handleCreateTask} className="app-card flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-lg font-semibold">Nueva tarea</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Crea una tarea con lo mínimo útil y evita ruido innecesario.
            </p>
          </div>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Título</span>
            <input
              value={form.titulo ?? ""}
              onChange={(event) => updateForm("titulo", event.target.value)}
              className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--accent)]"
              placeholder="Ej: llamar al proveedor"
              required
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Descripción</span>
            <textarea
              value={form.descripcion ?? ""}
              onChange={(event) => updateForm("descripcion", event.target.value)}
              className="min-h-28 rounded-2xl border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--accent)]"
              placeholder="Detalle breve, no una novela."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Prioridad</span>
              <select
                value={form.prioridad ?? "media"}
                onChange={(event) =>
                  updateForm("prioridad", event.target.value as TaskPriority)
                }
                className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--accent)]"
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Estado inicial</span>
              <select
                value={form.estado ?? "pendiente"}
                onChange={(event) =>
                  updateForm("estado", event.target.value as TaskStatus)
                }
                className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--accent)]"
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Categoría</span>
              <input
                value={form.categoria ?? ""}
                onChange={(event) => updateForm("categoria", event.target.value)}
                className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--accent)]"
                placeholder="Trabajo, personal, proveedor..."
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Fecha límite</span>
              <input
                type="date"
                value={form.fecha_limite ?? ""}
                onChange={(event) => updateForm("fecha_limite", event.target.value)}
                className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--accent)]"
              />
            </label>
          </div>

          {initialError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {initialError}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending || initialError != null}
            className="h-11 rounded-2xl bg-[var(--ink)] px-4 text-sm font-medium text-[var(--surface-strong)] disabled:opacity-60"
          >
            {isPending ? "Guardando..." : "Crear tarea"}
          </button>
        </form>

        <div className="flex flex-col gap-4">
          <section className="app-card p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px]">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Buscar</span>
                <input
                  value={filters.busqueda}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      busqueda: event.target.value,
                    }))
                  }
                  className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--accent)]"
                  placeholder="Título, categoría o descripción"
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Estado</span>
                <select
                  value={filters.estado}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      estado: event.target.value as Filters["estado"],
                    }))
                  }
                  className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--accent)]"
                >
                  <option value="todas">Todas</option>
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Prioridad</span>
                <select
                  value={filters.prioridad}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      prioridad: event.target.value as Filters["prioridad"],
                    }))
                  }
                  className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--accent)]"
                >
                  <option value="todas">Todas</option>
                  {TASK_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            {visibleTasks.length === 0 ? (
              <div className="app-card p-6 text-sm text-[var(--muted)]">
                {initialError
                  ? "Aplica primero la migración de Supabase para empezar a usar este módulo."
                  : "No hay tareas que coincidan con los filtros actuales."}
              </div>
            ) : (
              visibleTasks.map((task) => (
                <article
                  key={task.id}
                  className="app-card flex flex-col gap-4 p-5 xl:flex-row xl:items-start xl:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{task.titulo}</h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[task.estado]}`}
                      >
                        {STATUS_LABELS[task.estado]}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_TONE[task.prioridad]}`}
                      >
                        {PRIORITY_LABELS[task.prioridad]}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
                      <span>Categoría: {task.categoria ?? "Sin categoría"}</span>
                      <span>Fecha límite: {formatDate(task.fecha_limite)}</span>
                    </div>

                    {task.descripcion ? (
                      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                        {task.descripcion}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[170px_170px_auto] xl:min-w-[480px]">
                    <select
                      value={task.estado}
                      onChange={(event) =>
                        updateTask(
                          task.id,
                          { estado: event.target.value as TaskStatus },
                          "Estado actualizado.",
                        )
                      }
                      className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
                    >
                      {TASK_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>

                    <select
                      value={task.prioridad}
                      onChange={(event) =>
                        updateTask(
                          task.id,
                          { prioridad: event.target.value as TaskPriority },
                          "Prioridad actualizada.",
                        )
                      }
                      className="h-11 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
                    >
                      {TASK_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {PRIORITY_LABELS[priority]}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="h-11 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-900 hover:bg-rose-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
