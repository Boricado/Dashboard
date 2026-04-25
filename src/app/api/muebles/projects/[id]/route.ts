import { NextResponse } from "next/server";
import { deleteFurnitureProject, updateFurnitureProject } from "@/modules/muebles/db";
import { validateFurnitureProjectInput } from "@/modules/muebles/validation";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const payload = await request.json();
    const result = validateFurnitureProjectInput(payload);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const project = await updateFurnitureProject(id, result.data);
    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo actualizar el proyecto.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Params) {
  try {
    const { id } = await context.params;
    await deleteFurnitureProject(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo eliminar el proyecto.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
