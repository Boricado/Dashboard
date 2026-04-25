import { NextResponse } from "next/server";
import { upsertLicitacionTracking } from "@/modules/licitaciones/db";
import { validateLicitacionTrackingInput } from "@/modules/licitaciones/validation";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const payload = await request.json();
    const result = validateLicitacionTrackingInput(payload);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const tracking = await upsertLicitacionTracking(id, result.data);
    return NextResponse.json({ tracking }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo guardar el seguimiento.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
