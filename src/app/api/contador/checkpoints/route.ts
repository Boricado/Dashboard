import { NextResponse } from "next/server";
import { upsertContadorCheckpoint } from "@/modules/contador/db";
import type { ContadorItemType } from "@/modules/contador/types";

function isItemType(value: unknown): value is ContadorItemType {
  return value === "monthly_tax" || value === "startup_task" || value === "annual_obligation";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (typeof payload?.itemKey !== "string" || payload.itemKey.trim().length === 0) {
      return NextResponse.json({ error: "itemKey es obligatorio." }, { status: 400 });
    }

    if (!isItemType(payload?.itemType)) {
      return NextResponse.json({ error: "itemType invalido." }, { status: 400 });
    }

    if (typeof payload?.isCompleted !== "boolean") {
      return NextResponse.json({ error: "isCompleted debe ser boolean." }, { status: 400 });
    }

    const checkpoint = await upsertContadorCheckpoint(
      payload.itemKey.trim(),
      payload.itemType,
      payload.isCompleted,
    );

    return NextResponse.json({ checkpoint }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo actualizar el estado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
