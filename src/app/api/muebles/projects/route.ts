import { NextResponse } from "next/server";
import { createFurnitureProject } from "@/modules/muebles/db";
import { validateFurnitureProjectInput } from "@/modules/muebles/validation";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = validateFurnitureProjectInput(payload);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const project = await createFurnitureProject(result.data);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el proyecto.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
