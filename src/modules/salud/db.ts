import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  inbodyScans as seedInbodyScans,
  sessionHistory as legacySessionHistory,
  weeklyConsistency as legacyWeeklyConsistency,
  workoutRoutines as seedWorkoutRoutines,
  type ConsistencyPoint,
  type HealthPagePayload,
  type InBodyScan,
  type SessionHistoryItem,
  type WorkoutWeek,
} from "@/modules/salud/data";

export const HEALTH_INBODY_FILES_BUCKET = "health-inbody-files";

type InbodyRow = {
  id: string;
  scan_date: string;
  source_label: string | null;
  height_cm: number | null;
  age: number | null;
  weight_kg: number;
  body_water_l: number | null;
  proteins_kg: number | null;
  minerals_kg: number | null;
  body_fat_mass_kg: number | null;
  skeletal_muscle_kg: number | null;
  body_fat_percent: number | null;
  bmi: number | null;
  score: number | null;
  target_weight_kg: number | null;
  weight_control_kg: number | null;
  fat_control_kg: number | null;
  muscle_control_kg: number | null;
  waist_hip_ratio: number | null;
  visceral_fat_level: number | null;
  obesity_degree: number | null;
  basal_metabolic_rate_kcal: number | null;
  fat_free_mass_kg: number | null;
  ime_kg_m2: number | null;
  recommended_intake_kcal: number | null;
  segmental_lean: Record<string, unknown> | null;
  segmental_fat: Record<string, unknown> | null;
  impedance: Record<string, unknown> | null;
  file_name: string | null;
  file_path: string | null;
  file_mime_type: string | null;
  file_size: number | null;
};

type RoutineWeekRow = {
  id: string;
  week_code: string;
  label: string;
  focus: string | null;
  status_label: string | null;
  is_template: boolean;
  sort_order: number;
};

type RoutineDayRow = {
  id: string;
  week_id: string;
  day_index: number;
  day_short: string;
  day_name: string;
  session_name: string;
  status: "completed" | "today" | "upcoming" | "rest";
  note: string | null;
};

type SessionRow = {
  id: string;
  routine_week_id: string | null;
  week_label: string | null;
  session_date: string;
  session_type: string;
  status: "completado" | "parcial" | "pendiente";
  notes: string | null;
  created_at: string;
};

type SessionExerciseRow = {
  session_id: string;
  sort_order: number;
  name: string;
  sets_text: string | null;
  reps_text: string | null;
  load_text: string | null;
  completed: boolean;
  notes: string | null;
};

const INBODY_FILE_METADATA_BY_DATE: Record<
  string,
  { fileName: string; fileSize: number }
> = {
  "2024-07-23": {
    fileName: "166525586_20240723112351_InBody.jpg",
    fileSize: 426008,
  },
  "2025-06-28": {
    fileName: "166525586_20250628103509_InBody.jpg",
    fileSize: 430588,
  },
  "2025-11-23": {
    fileName: "166525586_20251123132152_InBody.jpg",
    fileSize: 433819,
  },
  "2026-03-10": {
    fileName: "100326-1_20260310170221_InBody.jpg",
    fileSize: 471958,
  },
  "2026-04-16": {
    fileName: "166525586_20260416100044_InBody.jpg",
    fileSize: 478807,
  },
};

const LEGACY_MONTHS: Record<string, string> = {
  ene: "01",
  feb: "02",
  mar: "03",
  abr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  ago: "08",
  sep: "09",
  sept: "09",
  oct: "10",
  nov: "11",
  dic: "12",
};

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function readSegmental(value: Record<string, unknown> | null) {
  const safeValue = value ?? {};

  return {
    leftArm: (safeValue.leftArm as InBodyScan["segmentalLean"]["leftArm"]) ?? {
      kg: 0,
      percent: 0,
    },
    rightArm: (safeValue.rightArm as InBodyScan["segmentalLean"]["rightArm"]) ?? {
      kg: 0,
      percent: 0,
    },
    trunk: (safeValue.trunk as InBodyScan["segmentalLean"]["trunk"]) ?? {
      kg: 0,
      percent: 0,
    },
    leftLeg: (safeValue.leftLeg as InBodyScan["segmentalLean"]["leftLeg"]) ?? {
      kg: 0,
      percent: 0,
    },
    rightLeg: (safeValue.rightLeg as InBodyScan["segmentalLean"]["rightLeg"]) ?? {
      kg: 0,
      percent: 0,
    },
  };
}

function readImpedance(value: Record<string, unknown> | null) {
  const safeValue = value ?? {};

  return {
    z20: (safeValue.z20 as InBodyScan["impedance"]["z20"]) ?? {
      bd: 0,
      bi: 0,
      tr: 0,
      pd: 0,
      pi: 0,
    },
    z100: (safeValue.z100 as InBodyScan["impedance"]["z100"]) ?? {
      bd: 0,
      bi: 0,
      tr: 0,
      pd: 0,
      pi: 0,
    },
  };
}

function mapInbodyRow(row: InbodyRow): InBodyScan {
  return {
    id: row.id,
    date: row.scan_date,
    label: row.source_label ?? formatDateLabel(row.scan_date),
    heightCm: row.height_cm ?? 0,
    age: row.age ?? 0,
    weightKg: row.weight_kg,
    bodyWaterL: row.body_water_l ?? 0,
    proteinsKg: row.proteins_kg ?? 0,
    mineralsKg: row.minerals_kg ?? 0,
    bodyFatMassKg: row.body_fat_mass_kg ?? 0,
    skeletalMuscleKg: row.skeletal_muscle_kg ?? 0,
    bodyFatPercent: row.body_fat_percent ?? 0,
    bmi: row.bmi ?? 0,
    score: row.score ?? 0,
    targetWeightKg: row.target_weight_kg ?? 0,
    weightControlKg: row.weight_control_kg ?? 0,
    fatControlKg: row.fat_control_kg ?? 0,
    muscleControlKg: row.muscle_control_kg ?? 0,
    waistHipRatio: row.waist_hip_ratio ?? 0,
    visceralFatLevel: row.visceral_fat_level ?? 0,
    obesityDegree: row.obesity_degree ?? 0,
    basalMetabolicRateKcal: row.basal_metabolic_rate_kcal ?? 0,
    fatFreeMassKg: row.fat_free_mass_kg ?? 0,
    imeKgM2: row.ime_kg_m2 ?? 0,
    recommendedIntakeKcal: row.recommended_intake_kcal ?? undefined,
    segmentalLean: readSegmental(row.segmental_lean),
    segmentalFat: readSegmental(row.segmental_fat),
    impedance: readImpedance(row.impedance),
    fileName: row.file_name,
    filePath: row.file_path,
    fileMimeType: row.file_mime_type,
    fileSize: row.file_size,
  };
}

function buildConsistencyFromSessions(items: SessionHistoryItem[]): ConsistencyPoint[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    counts.set(item.week, (counts.get(item.week) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .map(([label, value]) => ({ label, value }));
}

function getInbodyFilePath(userId: string, fileName: string) {
  return `${userId}/inbody/${fileName}`;
}

function getInbodyFileMetadata(userId: string, scanDate: string) {
  const metadata = INBODY_FILE_METADATA_BY_DATE[scanDate];

  if (!metadata) {
    return {
      file_name: null,
      file_path: null,
      file_mime_type: null,
      file_size: null,
    };
  }

  return {
    file_name: metadata.fileName,
    file_path: getInbodyFilePath(userId, metadata.fileName),
    file_mime_type: "image/jpeg",
    file_size: metadata.fileSize,
  };
}

function parseLegacySessionDate(label: string) {
  const normalized = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(".", "")
    .trim();
  const match = normalized.match(/^(\d{1,2})\s+([a-z]+)/);

  if (!match) {
    return "2026-01-01";
  }

  const day = match[1].padStart(2, "0");
  const month = LEGACY_MONTHS[match[2]] ?? "01";

  return `2026-${month}-${day}`;
}

function normalizeLegacyDetail(value: string) {
  return value.replace(/\u00c2\u00b7/g, "\u00b7").replace(/\s+/g, " ").trim();
}

function splitLegacyExerciseDetails(item: SessionHistoryItem) {
  const explicitDetails = item.details.map(normalizeLegacyDetail).filter(Boolean);

  if (explicitDetails.length > 0) {
    return explicitDetails;
  }

  const noteDetails = (item.notes ?? "")
    .split(/\s*(?:\u00b7|\u00c2\u00b7)\s*/g)
    .map(normalizeLegacyDetail)
    .filter(Boolean);

  if (noteDetails.length > 0) {
    return noteDetails;
  }

  return item.summary ? [normalizeLegacyDetail(item.summary)] : [];
}

function parseLegacyExerciseDetail(detail: string) {
  const [rawName, ...rest] = detail.split(":");
  const metadata = rest.join(":") || detail;
  const sets = metadata.match(/series\s+([^\u00b7]+)/i)?.[1]?.trim();
  const reps = metadata.match(/reps\s+([^\u00b7]+)/i)?.[1]?.trim();
  const load = metadata.match(/carga\s+([^\u00b7]+)/i)?.[1]?.trim();

  return {
    name: normalizeLegacyDetail(rawName).slice(0, 160) || "Registro importado",
    sets_text: sets ?? null,
    reps_text: reps ?? null,
    load_text: load ?? null,
    notes: normalizeLegacyDetail(detail),
  };
}

async function ensureInbodyFileMetadata(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { count, error: countError } = await supabase
    .from("health_inbody_scans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("scan_date", Object.keys(INBODY_FILE_METADATA_BY_DATE))
    .is("file_path", null);

  if (countError) {
    throw new Error(countError.message);
  }

  if (!count) {
    return;
  }

  const results = await Promise.all(
    Object.entries(INBODY_FILE_METADATA_BY_DATE).map(([scanDate, metadata]) =>
      supabase
        .from("health_inbody_scans")
        .update({
          file_name: metadata.fileName,
          file_path: getInbodyFilePath(userId, metadata.fileName),
          file_mime_type: "image/jpeg",
          file_size: metadata.fileSize,
        })
        .eq("user_id", userId)
        .eq("scan_date", scanDate),
    ),
  );
  const updateError = results.find((result) => result.error)?.error;

  if (updateError) {
    throw new Error(updateError.message);
  }
}

async function ensureLegacySessionHistory(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { count, error: countError } = await supabase
    .from("health_workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("source", "imported");

  if (countError) {
    throw new Error(countError.message);
  }

  if (count) {
    return;
  }

  const { data: insertedSessions, error: sessionInsertError } = await supabase
    .from("health_workout_sessions")
    .upsert(
      legacySessionHistory.map((item) => ({
        user_id: userId,
        routine_week_id: null,
        routine_day_id: null,
        week_label: item.week,
        external_id: item.id,
        session_date: parseLegacySessionDate(item.date),
        session_type: item.session,
        status: "completado",
        notes: item.notes || item.summary || null,
        source: "imported",
      })),
      { onConflict: "user_id,source,external_id" },
    )
    .select("id, external_id");

  if (sessionInsertError) {
    throw new Error(sessionInsertError.message);
  }

  const sessionIdByExternalId = new Map(
    (insertedSessions ?? []).map((item) => [item.external_id as string, item.id as string]),
  );
  const exercisePayload = legacySessionHistory.flatMap((item) => {
    const sessionId = sessionIdByExternalId.get(item.id);

    if (!sessionId) {
      return [];
    }

    return splitLegacyExerciseDetails(item).map((detail, index) => ({
      session_id: sessionId,
      sort_order: index,
      completed: true,
      ...parseLegacyExerciseDetail(detail),
    }));
  });

  if (exercisePayload.length === 0) {
    return;
  }

  const { error: exerciseInsertError } = await supabase
    .from("health_workout_session_exercises")
    .insert(exercisePayload);

  if (exerciseInsertError) {
    throw new Error(exerciseInsertError.message);
  }
}

async function ensureHealthSeedData() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay una sesión activa.");
  }

  const [{ count: scansCount, error: scansCountError }, { count: weeksCount, error: weeksCountError }] =
    await Promise.all([
      supabase
        .from("health_inbody_scans")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("health_routine_weeks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  if (scansCountError) {
    throw new Error(scansCountError.message);
  }

  if (weeksCountError) {
    throw new Error(weeksCountError.message);
  }

  if (!scansCount) {
    const payload = seedInbodyScans.map((scan) => ({
      user_id: user.id,
      scan_date: scan.date,
      source_label: scan.label,
      height_cm: scan.heightCm || null,
      age: scan.age || null,
      weight_kg: scan.weightKg,
      body_water_l: scan.bodyWaterL || null,
      proteins_kg: scan.proteinsKg || null,
      minerals_kg: scan.mineralsKg || null,
      body_fat_mass_kg: scan.bodyFatMassKg || null,
      skeletal_muscle_kg: scan.skeletalMuscleKg || null,
      body_fat_percent: scan.bodyFatPercent || null,
      bmi: scan.bmi || null,
      score: scan.score || null,
      target_weight_kg: scan.targetWeightKg || null,
      weight_control_kg: scan.weightControlKg || null,
      fat_control_kg: scan.fatControlKg || null,
      muscle_control_kg: scan.muscleControlKg || null,
      waist_hip_ratio: scan.waistHipRatio || null,
      visceral_fat_level: scan.visceralFatLevel || null,
      obesity_degree: scan.obesityDegree || null,
      basal_metabolic_rate_kcal: scan.basalMetabolicRateKcal || null,
      fat_free_mass_kg: scan.fatFreeMassKg || null,
      ime_kg_m2: scan.imeKgM2 || null,
      recommended_intake_kcal: scan.recommendedIntakeKcal ?? null,
      segmental_lean: scan.segmentalLean,
      segmental_fat: scan.segmentalFat,
      impedance: scan.impedance,
      ...getInbodyFileMetadata(user.id, scan.date),
    }));

    const { error } = await supabase.from("health_inbody_scans").insert(payload);

    if (error) {
      throw new Error(error.message);
    }
  }

  if (!weeksCount) {
    const weekPayload = seedWorkoutRoutines.map((week, index) => ({
      user_id: user.id,
      week_code: week.id,
      label: week.label,
      focus: week.focus,
      status_label: week.statusLabel,
      is_template: week.statusLabel.toLowerCase().includes("plantilla"),
      sort_order: index,
    }));

    const { data: createdWeeks, error: weekInsertError } = await supabase
      .from("health_routine_weeks")
      .insert(weekPayload)
      .select("id, week_code");

    if (weekInsertError) {
      throw new Error(weekInsertError.message);
    }

    const weekMap = new Map((createdWeeks ?? []).map((week) => [week.week_code, week.id]));
    const dayPayload = seedWorkoutRoutines.flatMap((week) =>
      week.days.map((day, index) => ({
        week_id: weekMap.get(week.id),
        day_index: index,
        day_short: day.dayShort,
        day_name: day.dayName,
        session_name: day.session,
        status: day.status,
        note: day.note ?? null,
      })),
    );

    const validDayPayload = dayPayload.filter((item) => item.week_id);
    if (validDayPayload.length > 0) {
      const { error: dayInsertError } = await supabase
        .from("health_routine_days")
        .insert(validDayPayload);

      if (dayInsertError) {
        throw new Error(dayInsertError.message);
      }
    }
  }

  await ensureInbodyFileMetadata(user.id);
  await ensureLegacySessionHistory(user.id);
}

export async function getHealthPageData(): Promise<HealthPagePayload> {
  await ensureHealthSeedData();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay una sesión activa.");
  }

  const [scanResult, weekResult, dayResult, sessionResult, exerciseResult] = await Promise.all([
    supabase
      .from("health_inbody_scans")
      .select(
        "id, scan_date, source_label, height_cm, age, weight_kg, body_water_l, proteins_kg, minerals_kg, body_fat_mass_kg, skeletal_muscle_kg, body_fat_percent, bmi, score, target_weight_kg, weight_control_kg, fat_control_kg, muscle_control_kg, waist_hip_ratio, visceral_fat_level, obesity_degree, basal_metabolic_rate_kcal, fat_free_mass_kg, ime_kg_m2, recommended_intake_kcal, segmental_lean, segmental_fat, impedance, file_name, file_path, file_mime_type, file_size",
      )
      .eq("user_id", user.id)
      .order("scan_date", { ascending: true }),
    supabase
      .from("health_routine_weeks")
      .select("id, week_code, label, focus, status_label, is_template, sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("health_routine_days")
      .select("id, week_id, day_index, day_short, day_name, session_name, status, note")
      .order("day_index", { ascending: true }),
    supabase
      .from("health_workout_sessions")
      .select("id, routine_week_id, week_label, session_date, session_type, status, notes, created_at")
      .eq("user_id", user.id)
      .order("session_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("health_workout_session_exercises")
      .select("session_id, sort_order, name, sets_text, reps_text, load_text, completed, notes")
      .order("sort_order", { ascending: true }),
  ]);

  if (scanResult.error) {
    throw new Error(scanResult.error.message);
  }
  if (weekResult.error) {
    throw new Error(weekResult.error.message);
  }
  if (dayResult.error) {
    throw new Error(dayResult.error.message);
  }
  if (sessionResult.error) {
    throw new Error(sessionResult.error.message);
  }
  if (exerciseResult.error) {
    throw new Error(exerciseResult.error.message);
  }

  const scans = (scanResult.data ?? []).map((row) => mapInbodyRow(row as InbodyRow));
  const weeks = (weekResult.data ?? []) as RoutineWeekRow[];
  const days = (dayResult.data ?? []) as RoutineDayRow[];
  const sessions = (sessionResult.data ?? []) as SessionRow[];
  const exercises = (exerciseResult.data ?? []) as SessionExerciseRow[];

  const workoutRoutines: WorkoutWeek[] = weeks.map((week) => ({
    id: week.id,
    label: week.label,
    focus: week.focus ?? "",
    statusLabel: week.status_label ?? "",
    days: days
      .filter((day) => day.week_id === week.id)
      .map((day) => ({
        dayShort: day.day_short,
        dayName: day.day_name,
        session: day.session_name,
        status: day.status,
        note: day.note ?? undefined,
      })),
  }));

  const weekMap = new Map(weeks.map((week) => [week.id, week.label.replace("Semana ", "S")]));
  const exerciseMap = new Map<string, SessionExerciseRow[]>();

  for (const exercise of exercises) {
    const current = exerciseMap.get(exercise.session_id) ?? [];
    current.push(exercise);
    exerciseMap.set(exercise.session_id, current);
  }

  const savedSessionHistory: SessionHistoryItem[] = sessions.map((session) => {
    const relatedExercises = exerciseMap.get(session.id) ?? [];
    const details = relatedExercises.map((exercise) =>
      [
        exercise.completed ? "OK" : "Pendiente",
        exercise.name,
        exercise.sets_text ? `${exercise.sets_text} series` : "",
        exercise.reps_text ? `${exercise.reps_text} reps` : "",
        exercise.load_text ?? "",
        exercise.notes ?? "",
      ]
        .filter(Boolean)
        .join(" · "),
    );

    return {
      id: session.id,
      date: formatDateLabel(session.session_date),
      week: session.week_label ?? weekMap.get(session.routine_week_id ?? "") ?? "Manual",
      session: session.session_type,
      summary:
        session.status === "completado"
          ? `${relatedExercises.filter((item) => item.completed).length} ejercicios completados`
          : session.status,
      notes: session.notes ?? undefined,
      details,
    };
  });

  const sessionHistory = savedSessionHistory.length > 0 ? savedSessionHistory : legacySessionHistory;

  const weeklyConsistency =
    sessionHistory.length > 0
      ? buildConsistencyFromSessions(sessionHistory)
      : legacyWeeklyConsistency;

  return {
    inbodyScans: scans.length > 0 ? scans : seedInbodyScans,
    workoutRoutines: workoutRoutines.length > 0 ? workoutRoutines : seedWorkoutRoutines,
    sessionHistory,
    weeklyConsistency,
  };
}

export async function createHealthWorkoutSession(input: {
  routineWeekId?: string | null;
  sessionDate: string;
  sessionType: string;
  weekLabel?: string | null;
  status: "completado" | "parcial" | "pendiente";
  notes?: string;
  exercises: Array<{
    name: string;
    setsText?: string;
    repsText?: string;
    loadText?: string;
    completed: boolean;
  }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay una sesión activa.");
  }

  const { data: session, error: sessionError } = await supabase
    .from("health_workout_sessions")
    .insert({
      user_id: user.id,
      routine_week_id: input.routineWeekId ?? null,
      week_label: input.weekLabel ?? null,
      session_date: input.sessionDate,
      session_type: input.sessionType,
      status: input.status,
      notes: input.notes ?? null,
      source: "manual",
    })
    .select("id, routine_week_id, session_date, session_type, status, notes, created_at")
    .single();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (input.exercises.length > 0) {
    const { error: exerciseError } = await supabase
      .from("health_workout_session_exercises")
      .insert(
        input.exercises.map((exercise, index) => ({
          session_id: session.id,
          sort_order: index,
          name: exercise.name,
          sets_text: exercise.setsText ?? null,
          reps_text: exercise.repsText ?? null,
          load_text: exercise.loadText ?? null,
          completed: exercise.completed,
        })),
      );

    if (exerciseError) {
      throw new Error(exerciseError.message);
    }
  }

  return session as SessionRow;
}
