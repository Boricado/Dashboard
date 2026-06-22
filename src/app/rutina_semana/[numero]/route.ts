// Ruta dinámica: /rutina_semana/<numero>
// Genera HTML de la rutina semanal desde tablas dedicadas:
//   health_routine_day_exercises + health_routine_day_meta
// Fallback a la columna note (JSON) si las tablas están vacías

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateWeekHtml, DayDbData } from "@/modules/salud/routine-html";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<any> },
) {
  let { numero } = await params;
  // Strip .html extension if present (so /rutina_semana/21.html also works)
  numero = numero.replace(/\.html$/i, "");
  const weekCode = numero.startsWith("s") ? numero : `s${numero}`;

  try {
    const supabase = await createSupabaseServerClient();

    // Get all weeks
    const { data: allWeeks } = await supabase
      .from("health_routine_weeks")
      .select("id, week_code, label, focus, status_label, sort_order")
      .order("sort_order", { ascending: true });

    if (!allWeeks || allWeeks.length === 0) {
      return new NextResponse("No hay semanas de rutina configuradas", { status: 404 });
    }

    const week = allWeeks.find((w) => w.week_code === weekCode);
    if (!week) {
      return new NextResponse(`Semana ${weekCode} no encontrada`, { status: 404 });
    }

    // Get days for this week
    const { data: days } = await supabase
      .from("health_routine_days")
      .select("id, week_id, day_index, day_short, day_name, session_name, status, note")
      .eq("week_id", week.id)
      .order("day_index", { ascending: true });

    const weekDays = days || [];
    const dayIds = weekDays.map((d) => d.id);

    // Build dbDataByDay: try tables first, fall back to note column
    const dbDataByDay: Record<string, DayDbData> = {};

    // Fetch exercises from dedicated table
    let tablesHaveData = false;
    if (dayIds.length > 0) {
      const { data: exData } = await supabase
        .from("health_routine_day_exercises")
        .select("*")
        .in("day_id", dayIds)
        .order("sort_order", { ascending: true });

      if (exData && exData.length > 0) {
        tablesHaveData = true;
        // Group by day_id
        const exGrouped: Record<string, any[]> = {};
        for (const ex of exData) {
          if (!exGrouped[ex.day_id]) exGrouped[ex.day_id] = [];
          exGrouped[ex.day_id].push(ex);
        }

        // Fetch meta
        const { data: metaData } = await supabase
          .from("health_routine_day_meta")
          .select("*")
          .in("day_id", dayIds);

        const metaMap: Record<string, any> = {};
        if (metaData) {
          for (const m of metaData) {
            metaMap[m.day_id] = m;
          }
        }

        for (const day of weekDays) {
          const exs = exGrouped[day.id] || [];
          const meta = metaMap[day.id];
          dbDataByDay[day.id] = {
            exercises: exs.map((ex: any) => ({
              letter: ex.letter,
              name: ex.name,
              muscle: ex.muscle,
              sets: ex.sets,
              reps: ex.reps,
              load: ex.load_text,
              loadPrev: ex.load_prev,
              badge: ex.badge,
              rest: ex.rest,
            })),
            meta: meta
              ? {
                  focus: meta.focus_text,
                  alertType: meta.alert_type,
                  alertText: meta.alert_text,
                  warmups: meta.warmup_data,
                  cardio: meta.cardio_data,
                }
              : null,
          };
        }
      }
    }

    // Fallback: parse note column if tables were empty
    if (!tablesHaveData) {
      for (const day of weekDays) {
        if (day.note && typeof day.note === "string") {
          try {
            const parsed = JSON.parse(day.note);
            dbDataByDay[day.id] = {
              exercises: parsed.exercises || [],
              meta: parsed.meta || null,
            };
          } catch {
            // invalid JSON
          }
        }
      }
    }

    const html = generateWeekHtml(week, weekDays, allWeeks, dbDataByDay);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error generating routine HTML:", error);
    return new NextResponse("Error interno al generar la rutina", { status: 500 });
  }
}
