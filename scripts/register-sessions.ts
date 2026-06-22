/**
 * Script para registrar sesiones de entrenamiento históricas.
 * Se conecta a Supabase con service_role (sin autenticación de usuario).
 *
 * Modo de uso:
 *   npx tsx scripts/register-sessions.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SERVICE_ROLE!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  // Obtener el usuario desde una sesión existente
  const { data: existingSession, error: sessionError } = await supabase
    .from("health_workout_sessions")
    .select("user_id")
    .limit(1);

  if (sessionError || !existingSession?.length) {
    console.error("No se pudo obtener el usuario desde sesiones existentes:", sessionError);
    process.exit(1);
  }

  const userId = existingSession[0].user_id;
  console.log(`Usuario ID: ${userId}`);

  // Obtener semanas de rutina
  const { data: weeks, error: weeksError } = await supabase
    .from("health_routine_weeks")
    .select("id, week_code, label, focus")
    .order("sort_order");

  if (weeksError) {
    console.error("Error al obtener semanas:", weeksError);
    process.exit(1);
  }

  const weekMap = new Map(weeks.map((w) => [w.week_code, w]));
  console.log(`Semanas cargadas: ${weeks.length}`);

  // Obtener días de rutina
  const { data: days, error: daysError } = await supabase
    .from("health_routine_days")
    .select("id, week_id, day_index, day_short, day_name, session_name")
    .in("week_id", weeks.map((w) => w.id));

  if (daysError) {
    console.error("Error al obtener días:", daysError);
    process.exit(1);
  }

  const dayMap = new Map<string, { id: string; session_name: string }>();
  for (const day of days) {
    dayMap.set(`${day.week_id}-${day.day_index}`, day);
  }

  // ==========================================
  // SESIONES A REGISTRAR
  // ==========================================

  // --- 12 Junio (Viernes, Semana 19) --- Pull A ---
  // Semana 19 = s19, day_index 4 (Viernes)
  await registerSession(userId, weekMap, dayMap, "s19", 4, "Pull A", "completado", [
    { name: "Dominadas sin banda", setsText: "4", repsText: "4", loadText: "BW", completed: true },
    { name: "T-bar row", setsText: "4", repsText: "10", loadText: "100 Lb", completed: true },
    { name: "Remo unilateral con mancuerna", setsText: "4", repsText: "10", loadText: "35 kg c/u", completed: true },
    { name: "Face pulls", setsText: "4", repsText: "20", loadText: "Peso habitual", completed: true },
    { name: "Curl EZ en banco predicador", setsText: "3", repsText: "10", loadText: "Peso habitual", completed: true },
    { name: "Curl martillo con mancuernas", setsText: "3", repsText: "10 c/u", loadText: "Peso habitual", completed: true },
  ]);

  // --- 15 Junio (Lunes, Semana 20) --- Push A ---
  await registerSession(userId, weekMap, dayMap, "s20", 0, "Push A", "completado", [
    { name: "Press de banca plano (barra)", setsText: "4", repsText: "8", loadText: "Peso habitual", completed: true },
    { name: "Press inclinado con mancuernas", setsText: "3", repsText: "10", loadText: "Peso habitual", completed: true },
    { name: "Press militar con barra", setsText: "4", repsText: "10,10,10,8", loadText: "35 kg", completed: true },
    { name: "Elevaciones laterales", setsText: "4", repsText: "12", loadText: "10 kg (saltar 11→12.5 kg)", completed: true },
    { name: "Aperturas con mancuernas", setsText: "3", repsText: "8", loadText: "17.5 kg c/u", completed: true },
  ]);

  // --- 16 Junio (Martes, Semana 20) --- Pierna (en vez de Carrera) ---
  await registerSession(userId, weekMap, dayMap, "s20", 1, "Pierna", "completado", [
    { name: "Goblet squat con mancuerna", setsText: "4", repsText: "12", loadText: "25 kg (máx mancuernas)", completed: true },
    { name: "Romanian Deadlift con mancuernas", setsText: "4", repsText: "12", loadText: "25 kg c/u", completed: true },
    { name: "Hip thrust con barra", setsText: "4", repsText: "12", loadText: "55 lb por lado + barra 20 kg", completed: true },
    { name: "Curl isquio en máquina", setsText: "3", repsText: "12", loadText: "60 lb", completed: true },
    { name: "Elevaciones de talón excéntricas (escalón)", setsText: "4", repsText: "15 c/u", loadText: "Corporal", completed: true },
    { name: "Aductor en máquina", setsText: "2", repsText: "15", loadText: "82 lb", completed: true },
  ]);

  // --- 20 Junio (Sábado, Semana 20) --- Pull B (viernes, hecho sábado) ---
  // Usamos day_index 5 (sábado) para la fecha correcta, pero session_type Pull B
  await registerSession(userId, weekMap, dayMap, "s20", 5, "Pull B", "completado", [
    { name: "Jalón al pecho polea agarre ancho", setsText: "4", repsText: "12", loadText: "Peso habitual", completed: true },
    { name: "Remo con barra agarre prono", setsText: "4", repsText: "10", loadText: "Peso habitual", completed: true },
    { name: "Pullover con mancuerna", setsText: "3", repsText: "12", loadText: "Peso habitual", completed: true },
    { name: "Curl EZ barra de pie", setsText: "3", repsText: "10,7,6", loadText: "Peso habitual", completed: true },
    { name: "Curl inclinado con mancuerna", setsText: "3", repsText: "6,7,7 c/u", loadText: "12.5 kg c/u", completed: true },
  ]);

  console.log("\n✅ Todas las sesiones registradas exitosamente.");
}

async function registerSession(
  userId: string,
  weekMap: Map<string, any>,
  dayMap: Map<string, any>,
  weekCode: string,
  dayIndex: number,
  sessionType: string,
  status: string,
  exercises: { name: string; setsText: string; repsText: string; loadText: string; completed: boolean }[],
) {
  const week = weekMap.get(weekCode);
  if (!week) {
    console.error(`  ❌ Semana ${weekCode} no encontrada`);
    return;
  }

  const day = dayMap.get(`${week.id}-${dayIndex}`);
  const weekLabel = `S${weekCode.replace("s", "")}`;

  // Calcular la fecha según la semana y el día
  const sessionDate = getDateForWeekDay(weekCode, dayIndex);

  // Insertar sesión
  const { data: session, error: sessionError } = await supabase
    .from("health_workout_sessions")
    .insert({
      user_id: userId,
      routine_week_id: week.id,
      routine_day_id: day?.id ?? null,
      week_label: weekLabel,
      session_date: sessionDate,
      session_type: sessionType,
      status,
      notes: `Registrado desde script`,
      source: "manual",
    })
    .select("id")
    .single();

  if (sessionError) {
    console.error(`  ❌ Error al crear sesión ${sessionType} (${sessionDate}):`, sessionError.message);
    return;
  }

  console.log(`  ✅ ${sessionDate} · ${weekLabel} · ${sessionType}`);

  // Insertar ejercicios
  const exercisePayload = exercises.map((ex, i) => ({
    session_id: session.id,
    sort_order: i,
    name: ex.name,
    sets_text: ex.setsText,
    reps_text: ex.repsText,
    load_text: ex.loadText,
    completed: ex.completed,
    notes: null,
  }));

  const { error: exError } = await supabase
    .from("health_workout_session_exercises")
    .insert(exercisePayload);

  if (exError) {
    console.error(`    ❌ Error al insertar ejercicios:`, exError.message);
    return;
  }

  const doneCount = exercises.filter((e) => e.completed).length;
  console.log(`    ${doneCount}/${exercises.length} ejercicios registrados`);
}

function getDateForWeekDay(weekCode: string, dayIndex: number): string {
  // Anchor: Semana 12 comienza el 20 de Abril de 2026
  // s12 → April 20 (Monday)
  const weekNum = parseInt(weekCode.replace("s", ""));
  const anchorWeek = 12;
  const anchorDate = new Date("2026-04-20T00:00:00");
  const weeksDiff = weekNum - anchorWeek;
  const targetDate = new Date(anchorDate);
  targetDate.setDate(anchorDate.getDate() + weeksDiff * 7 + dayIndex);
  return targetDate.toISOString().slice(0, 10);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
