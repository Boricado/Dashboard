import { NextResponse } from "next/server";
import { deleteTask, updateTask } from "@/modules/tareas/data";
import { validateUpdateTaskInput } from "@/modules/tareas/validation";

function parseTaskId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const id = parseTaskId(params.id);

  if (!id) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const result = validateUpdateTaskInput(payload);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const task = await updateTask(id, result.data);
    return NextResponse.json({ task });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo actualizar la tarea.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const id = parseTaskId(params.id);

  if (!id) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    await deleteTask(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo eliminar la tarea.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
