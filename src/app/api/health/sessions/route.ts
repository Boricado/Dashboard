import { NextResponse } from "next/server";
import { createHealthWorkoutSession } from "@/modules/salud/db";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      routineWeekId?: string | null;
      sessionDate: string;
      sessionType: string;
      weekLabel?: string | null;
      status: "completado" | "parcial" | "pendiente";
      notes?: string;
      exercises?: Array<{
        name?: string;
        setsText?: string;
        repsText?: string;
        loadText?: string;
        completed?: boolean;
      }>;
    };
    const session = await createHealthWorkoutSession({
      routineWeekId: payload.routineWeekId ?? null,
      sessionDate: payload.sessionDate,
      sessionType: payload.sessionType,
      weekLabel: payload.weekLabel ?? null,
      status: payload.status,
      notes: payload.notes ?? "",
      exercises: Array.isArray(payload.exercises)
        ? payload.exercises.map((exercise) => ({
            name: String(exercise.name ?? ""),
            setsText: exercise.setsText ? String(exercise.setsText) : "",
            repsText: exercise.repsText ? String(exercise.repsText) : "",
            loadText: exercise.loadText ? String(exercise.loadText) : "",
            completed: Boolean(exercise.completed),
          }))
        : [],
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo registrar la sesión.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
