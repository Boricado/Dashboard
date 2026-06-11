import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const SUPABASE_URL = env.supabase.url();
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function POST(request: Request) {
  if (!SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY no configurada" },
      { status: 500 },
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const body = await request.json();
    const { userId, sessionDate, sessionType, weekCode, weekLabel, exercises, status, notes } = body;

    if (!userId || !sessionDate || !sessionType || !exercises) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos requeridos: userId, sessionDate, sessionType, exercises" },
        { status: 400 },
      );
    }

    // 1. Buscar o crear la routine week
    let routineWeekId = null;
    if (weekCode) {
      const { data: week } = await supabase
        .from("health_routine_weeks")
        .select("id")
        .eq("user_id", userId)
        .eq("week_code", weekCode)
        .maybeSingle();

      routineWeekId = week?.id ?? null;
    }

    // 2. Insertar sesión
    const { data: session, error: sessionError } = await supabase
      .from("health_workout_sessions")
      .insert({
        user_id: userId,
        routine_week_id: routineWeekId,
        session_date: sessionDate,
        session_type: sessionType,
        week_label: weekLabel ?? null,
        status: status ?? "completado",
        notes: notes ?? null,
        source: "manual",
      })
      .select("id")
      .single();

    if (sessionError) {
      return NextResponse.json(
        { ok: false, error: `Error al crear sesión: ${sessionError.message}` },
        { status: 500 },
      );
    }

    // 3. Insertar ejercicios
    const exercisePayload = exercises.map((ex: any, index: number) => ({
      session_id: session.id,
      sort_order: index,
      name: ex.name,
      sets_text: ex.setsText ?? null,
      reps_text: ex.repsText ?? null,
      load_text: ex.loadText ?? null,
      completed: ex.completed ?? true,
      notes: ex.notes ?? null,
    }));

    const { error: exerciseError } = await supabase
      .from("health_workout_session_exercises")
      .insert(exercisePayload);

    if (exerciseError) {
      return NextResponse.json(
        { ok: false, error: `Error al insertar ejercicios: ${exerciseError.message}` },
        { status: 500 },
      );
    }

    // 4. Marcar el día de la rutina como completado si corresponde
    if (routineWeekId && body.dayShort) {
      const { data: day } = await supabase
        .from("health_routine_days")
        .select("id")
        .eq("week_id", routineWeekId)
        .eq("day_short", body.dayShort)
        .maybeSingle();

      if (day) {
        await supabase
          .from("health_routine_days")
          .update({ status: "completed" })
          .eq("id", day.id);
      }
    }

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
