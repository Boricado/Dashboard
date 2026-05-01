import { NextResponse } from "next/server";
import { updateFurnitureMaterial } from "@/modules/muebles/db";
import { validateFurnitureMaterialInput } from "@/modules/muebles/validation";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const payload = await request.json();
    const result = validateFurnitureMaterialInput(payload);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const material = await updateFurnitureMaterial(id, result.data);
    return NextResponse.json({ material }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo actualizar el material.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
