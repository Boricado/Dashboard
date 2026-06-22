/**
 * Sincroniza los ejercicios de routine-exercises.ts hacia Supabase.
 * Borra y recrea health_routine_day_exercises + health_routine_day_meta
 * para todos los días de todas las semanas.
 */
import { createClient } from "@supabase/supabase-js";
import {
  pushAExercises,
  pushBExercises,
  piernaExercises,
  pullAExercises,
  pullBExercises,
  warmups,
  type ExercisePlan,
} from "../src/modules/salud/routine-exercises";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SERVICE_ROLE!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const DAY_SESSION_MAP: Record<string, ExercisePlan[]> = {
  "Push A": pushAExercises,
  "Push B": pushBExercises,
  Pierna: piernaExercises,
  "Pull A": pullAExercises,
  "Pull B": pullBExercises,
};

async function main() {
  const { data: weeks } = await supabase
    .from("health_routine_weeks")
    .select("id, week_code")
    .order("sort_order");

  if (!weeks?.length) {
    console.log("No hay semanas.");
    return;
  }

  const { data: days } = await supabase
    .from("health_routine_days")
    .select("id, week_id, day_index, session_name")
    .in("week_id", weeks.map((w) => w.id));

  if (!days?.length) {
    console.log("No hay días.");
    return;
  }

  // Delete existing data for these days
  const dayIds = days.map((d) => d.id);
  await supabase.from("health_routine_day_exercises").delete().in("day_id", dayIds);
  await supabase.from("health_routine_day_meta").delete().in("day_id", dayIds);
  console.log(`🗑️  Datos anteriores eliminados para ${dayIds.length} días.`);

  let inserted = 0;
  for (const day of days) {
    const exercises = DAY_SESSION_MAP[day.session_name];
    if (!exercises) continue; // Carrera, Descanso, etc. no tienen ejercicios de fuerza

    const weekCode = weeks.find((w) => w.id === day.week_id)?.week_code ?? "base";

    const payload = exercises.map((ex, i) => ({
      day_id: day.id,
      sort_order: i,
      letter: ex.letter,
      name: ex.name,
      muscle: ex.muscle,
      sets: ex.sets,
      reps: ex.reps,
      load_text: ex.weightByWeek[weekCode] || ex.weightByWeek.base || "",
      load_prev: null,
      badge: ex.badgeMap?.[weekCode] || null,
      rest: ex.rest,
    }));

    const { error } = await supabase.from("health_routine_day_exercises").insert(payload);
    if (error) {
      console.error(`  ❌ Error en día ${day.id} (${day.session_name}):`, error.message);
    } else {
      inserted += payload.length;
    }
  }

  // También actualizar warmups como meta
  for (const day of days) {
    const session = day.session_name.toLowerCase();
    let warmupType = "push";
    if (session.includes("pierna")) warmupType = "pierna";
    else if (session.includes("pull")) warmupType = "pull";
    else if (session.includes("carrera") || session.includes("tirada")) warmupType = "cardio";
    else continue;

    const dayWarmups = warmups[warmupType] || [];
    const { error } = await supabase.from("health_routine_day_meta").upsert(
      {
        day_id: day.id,
        focus_text: null,
        alert_type: "green",
        alert_text: "Semana en progreso. Técnica sobre peso.",
        warmup_data: dayWarmups,
        cardio_data: null,
      },
      { onConflict: "day_id" },
    );
    if (error) console.error(`  ❌ Error meta día ${day.id}:`, error.message);
  }

  console.log(`✅ ${inserted} ejercicios insertados en ${days.length} días.`);
  console.log("🎯 Recordá actualizar también la nota de cada día si querés el fallback.");
}

main().catch(console.error);
