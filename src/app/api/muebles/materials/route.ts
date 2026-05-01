import { NextResponse } from "next/server";
import { createFurnitureMaterial } from "@/modules/muebles/db";
import { validateFurnitureMaterialInput } from "@/modules/muebles/validation";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = validateFurnitureMaterialInput(payload);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const material = await createFurnitureMaterial(result.data);
    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el material.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
