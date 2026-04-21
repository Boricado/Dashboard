import { NextResponse } from "next/server";
import { createTask, listTasks } from "@/modules/tareas/data";
import { validateCreateTaskInput } from "@/modules/tareas/validation";

export async function GET() {
  try {
    const tasks = await listTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron cargar las tareas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = validateCreateTaskInput(payload);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const task = await createTask(result.data);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo crear la tarea.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
