"use client";

import { useEffect, useMemo, useState } from "react";
import {
  routineTemplates,
  routineHtmlWeeks,
  routinePlanAnchor,
  type ConsistencyPoint,
  type HealthPagePayload,
  type SessionHistoryItem,
  type WorkoutWeek,
  type WorkoutDay,
} from "@/modules/salud/data";

const SEGMENT_LABELS = [
  { key: "leftArm", label: "Brazo izq." },
  { key: "rightArm", label: "Brazo der." },
  { key: "trunk", label: "Tronco" },
  { key: "leftLeg", label: "Pierna izq." },
  { key: "rightLeg", label: "Pierna der." },
] as const;

const IMPEDANCE_COLUMNS = [
  { key: "bd", label: "BD" },
  { key: "bi", label: "BI" },
  { key: "tr", label: "TR" },
  { key: "pd", label: "PD" },
  { key: "pi", label: "PI" },
] as const;

const STATUS_STYLE: Record<WorkoutDay["status"], string> = {
  completed: "bg-emerald-100 text-emerald-800",
  today: "bg-emerald-700 text-white",
  upcoming: "bg-[#eceaf8] text-[#6e6a85]",
  rest: "bg-zinc-100 text-zinc-700",
};

type RegistrationExercise = {
  name: string;
  sets: string;
  reps: string;
  load: string;
  done: boolean;
};

type RegistrationDraft = {
  date: string;
  type: string;
  status: "completado" | "parcial" | "pendiente";
  notes: string;
  exercises: RegistrationExercise[];
};

function formatSignedDelta(value: number) {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) {
    return "0";
  }

  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(Math.abs(rounded) % 1 === 0 ? 0 : 1)}`;
}

function currentRoutineDayIndex() {
  const today = new Date().getDay();
  const map: Record<number, number> = {
    1: 0,
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    0: 6,
  };

  return map[today] ?? 0;
}

function parseWeekNumber(label: string) {
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date: Date) {
  const copy = startOfDay(date);
  const dayOffset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - dayOffset);
  return copy;
}

function diffInWholeWeeks(from: Date, to: Date) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((startOfWeek(to).getTime() - startOfWeek(from).getTime()) / msPerWeek);
}

function getPlannedWeekNumber(today: Date) {
  const anchorDate = new Date(`${routinePlanAnchor.weekStartDate}T00:00:00`);
  return routinePlanAnchor.weekNumber + diffInWholeWeeks(anchorDate, today);
}

function buildWeekStatusLabel(weekNumber: number, activeWeekNumber: number) {
  if (weekNumber < activeWeekNumber) {
    return "Completada";
  }

  if (weekNumber === activeWeekNumber) {
    return "En curso";
  }

  if (weekNumber === activeWeekNumber + 1) {
    return "Siguiente bloque";
  }

  return "Plantilla";
}

function normalizeRoutineStatus(
  week: WorkoutWeek,
  weekNumber: number,
  activeWeekNumber: number,
  todayDayIndex: number,
): WorkoutWeek {
  return {
    ...week,
    statusLabel: buildWeekStatusLabel(weekNumber, activeWeekNumber),
    days: week.days.map((day, dayIndex) => {
      if (day.status === "rest" || /descanso/i.test(day.session)) {
        return {
          ...day,
          status: "rest",
          note: dayIndex === todayDayIndex && weekNumber === activeWeekNumber ? "Recuperacion" : day.note,
        };
      }

      if (weekNumber < activeWeekNumber) {
        return { ...day, status: "completed" };
      }

      if (weekNumber > activeWeekNumber) {
        return { ...day, status: "upcoming" };
      }

      if (dayIndex < todayDayIndex) {
        return { ...day, status: "completed" };
      }

      if (dayIndex === todayDayIndex) {
        return { ...day, status: "today", note: "Hoy" };
      }

      return { ...day, status: "upcoming" };
    }),
  };
}

function buildRoutineViewModel(routines: WorkoutWeek[], today: Date) {
  const todayDayIndex = currentRoutineDayIndex();
  const plannedWeekNumber = getPlannedWeekNumber(today);
  const numberedWeeks = routines.map((week, index) => ({
    index,
    week,
    weekNumber: parseWeekNumber(week.label) ?? routinePlanAnchor.weekNumber + index,
  }));

  const activeWeekEntry =
    numberedWeeks.find((entry) => entry.weekNumber === plannedWeekNumber) ??
    numberedWeeks.filter((entry) => entry.weekNumber <= plannedWeekNumber).at(-1) ??
    numberedWeeks[0];

  const activeWeekNumber = activeWeekEntry?.weekNumber ?? plannedWeekNumber;
  const activeWeekId = activeWeekEntry?.week.id ?? routines[0]?.id ?? "";
  const activeDayIndex = Math.min(todayDayIndex, Math.max((activeWeekEntry?.week.days.length ?? 1) - 1, 0));
  const activeHtmlWeek = routineHtmlWeeks.includes(activeWeekNumber)
    ? activeWeekNumber
    : activeWeekEntry?.weekNumber ?? routineHtmlWeeks[0] ?? routinePlanAnchor.weekNumber;

  return {
    activeWeekId,
    activeDayIndex,
    activeHtmlWeek,
    routines: numberedWeeks.map((entry) =>
      normalizeRoutineStatus(entry.week, entry.weekNumber, activeWeekNumber, todayDayIndex),
    ),
  };
}

function toInputDate(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function chartHeight(value: number, min: number, max: number, maxPx: number) {
  if (max <= min) {
    return Math.round(maxPx * 0.6);
  }

  const ratio = (value - min) / (max - min);
  return Math.max(18, Math.round(18 + ratio * (maxPx - 18)));
}

function parseSeries(series: string) {
  const compact = series.replace(/\s+/g, "");
  const parts = compact.split("x");
  if (parts.length === 2) {
    return {
      sets: parts[0],
      reps: parts[1],
    };
  }

  return {
    sets: "",
    reps: series,
  };
}

function buildExerciseDraft(session: string) {
  return (routineTemplates[session] ?? []).map((exercise) => {
    const parsed = parseSeries(exercise.series);

    return {
      name: exercise.name,
      sets: parsed.sets,
      reps: parsed.reps,
      load: exercise.load ?? "",
      done: true,
    };
  });
}

function sortConsistencyPoints(points: ConsistencyPoint[]) {
  return [...points].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true }),
  );
}

function incrementConsistencyPoint(points: ConsistencyPoint[], label: string) {
  const counts = new Map(points.map((point) => [point.label, point.value]));
  counts.set(label, (counts.get(label) ?? 0) + 1);

  return sortConsistencyPoints(
    [...counts.entries()].map(([pointLabel, value]) => ({
      label: pointLabel,
      value,
    })),
  );
}

function MiniMetricBar(props: { label: string; value: string; progress: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-[var(--muted)]">{props.label}</span>
        <span className="font-semibold text-[var(--ink)]">{props.value}</span>
      </div>
      <div className="h-2 rounded-full bg-[#e9e8f7]">
        <div
          className="h-full rounded-full bg-emerald-700"
          style={{ width: `${props.progress}%` }}
        />
      </div>
    </div>
  );
}

function ModalField(props: {
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          {props.label}
        </span>
        {props.action}
      </div>
      {props.children}
    </div>
  );
}

export function SaludClient(props: { initialData: HealthPagePayload }) {
  const initialRoutineView = useMemo(
    () => buildRoutineViewModel(props.initialData.workoutRoutines, new Date()),
    [props.initialData.workoutRoutines],
  );
  const [workoutRoutines, setWorkoutRoutines] = useState(initialRoutineView.routines);
  const [selectedWeekId, setSelectedWeekId] = useState(initialRoutineView.activeWeekId);
  const [selectedDayIndex, setSelectedDayIndex] = useState(initialRoutineView.activeDayIndex);
  const [selectedHtmlWeek, setSelectedHtmlWeek] = useState(initialRoutineView.activeHtmlWeek);
  const [selectedScanId, setSelectedScanId] = useState(
    props.initialData.inbodyScans[props.initialData.inbodyScans.length - 1]?.id ?? "",
  );
  const [sessionHistory, setSessionHistory] = useState(props.initialData.sessionHistory);
  const [weeklyConsistency, setWeeklyConsistency] = useState(
    props.initialData.weeklyConsistency,
  );
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationDraft | null>(null);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!registrationDraft) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setRegistrationDraft(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [registrationDraft]);

  const selectedWeek =
    workoutRoutines.find((week) => week.id === selectedWeekId) ??
    workoutRoutines[0];
  const selectedDay = selectedWeek.days[selectedDayIndex] ?? selectedWeek.days[0];
  const selectedExercises = routineTemplates[selectedDay.session] ?? [];
  const selectedScan =
    props.initialData.inbodyScans.find((scan) => scan.id === selectedScanId) ??
    props.initialData.inbodyScans[props.initialData.inbodyScans.length - 1];
  const latestScan = props.initialData.inbodyScans[props.initialData.inbodyScans.length - 1];
  const previousScan =
    props.initialData.inbodyScans[props.initialData.inbodyScans.length - 2] ?? latestScan;

  const weightTrend = props.initialData.inbodyScans.map((scan) => ({
    label: scan.label,
    value: scan.weightKg,
  }));
  const weightMin = Math.min(...weightTrend.map((point) => point.value));
  const weightMax = Math.max(...weightTrend.map((point) => point.value));
  const consistencyMin = 0;
  const consistencyMax = Math.max(...weeklyConsistency.map((point) => point.value), 1);
  const latestMeasurement = {
    title: "Composicion InBody",
    dateLabel: `Ultima medicion: ${latestScan.label}`,
    bodyFat: `${latestScan.bodyFatPercent.toFixed(1)}%`,
  };
  const compositionMetrics = [
    {
      label: "Masa muscular",
      value: `${latestScan.skeletalMuscleKg.toFixed(1)} kg`,
      progress: Math.min(100, Math.round((latestScan.skeletalMuscleKg / 45) * 100)),
    },
    {
      label: "Masa grasa",
      value: `${latestScan.bodyFatMassKg.toFixed(1)} kg`,
      progress: Math.min(100, Math.round((latestScan.bodyFatMassKg / 30) * 100)),
    },
    {
      label: "Score InBody",
      value: `${latestScan.score} pts`,
      progress: Math.min(100, latestScan.score),
    },
  ];
  const inbodyComparisonRows = useMemo(
    () =>
      [
        { label: "Peso", latestValue: latestScan.weightKg, previousValue: previousScan.weightKg, unit: "kg", betterWhen: "lower" as const },
        { label: "Masa muscular", latestValue: latestScan.skeletalMuscleKg, previousValue: previousScan.skeletalMuscleKg, unit: "kg", betterWhen: "higher" as const },
        { label: "Masa grasa", latestValue: latestScan.bodyFatMassKg, previousValue: previousScan.bodyFatMassKg, unit: "kg", betterWhen: "lower" as const },
        { label: "PGC", latestValue: latestScan.bodyFatPercent, previousValue: previousScan.bodyFatPercent, unit: "%", betterWhen: "lower" as const },
        { label: "Grasa visceral", latestValue: latestScan.visceralFatLevel, previousValue: previousScan.visceralFatLevel, unit: "niv", betterWhen: "lower" as const },
        { label: "BMR", latestValue: latestScan.basalMetabolicRateKcal, previousValue: previousScan.basalMetabolicRateKcal, unit: "kcal", betterWhen: "higher" as const },
        { label: "Brazo izq. magro", latestValue: latestScan.segmentalLean.leftArm.kg, previousValue: previousScan.segmentalLean.leftArm.kg, unit: "kg", betterWhen: "higher" as const },
        { label: "Brazo der. magro", latestValue: latestScan.segmentalLean.rightArm.kg, previousValue: previousScan.segmentalLean.rightArm.kg, unit: "kg", betterWhen: "higher" as const },
        { label: "Tronco magro", latestValue: latestScan.segmentalLean.trunk.kg, previousValue: previousScan.segmentalLean.trunk.kg, unit: "kg", betterWhen: "higher" as const },
        { label: "Pierna izq. grasa", latestValue: latestScan.segmentalFat.leftLeg.kg, previousValue: previousScan.segmentalFat.leftLeg.kg, unit: "kg", betterWhen: "lower" as const },
        { label: "Pierna der. grasa", latestValue: latestScan.segmentalFat.rightLeg.kg, previousValue: previousScan.segmentalFat.rightLeg.kg, unit: "kg", betterWhen: "lower" as const },
        { label: "Score InBody", latestValue: latestScan.score, previousValue: previousScan.score, unit: "pts", betterWhen: "higher" as const },
      ],
    [latestScan, previousScan],
  );

  const selectedLeanSegments = SEGMENT_LABELS.map((segment) => ({
    label: segment.label,
    value: selectedScan.segmentalLean[segment.key],
  }));
  const selectedFatSegments = SEGMENT_LABELS.map((segment) => ({
    label: segment.label,
    value: selectedScan.segmentalFat[segment.key],
  }));

  const scanDetails = [
    { label: "Agua corporal", value: `${selectedScan.bodyWaterL.toFixed(1)} L` },
    { label: "Proteinas", value: `${selectedScan.proteinsKg.toFixed(1)} kg` },
    { label: "Minerales", value: `${selectedScan.mineralsKg.toFixed(2)} kg` },
    { label: "Masa libre", value: `${selectedScan.fatFreeMassKg.toFixed(1)} kg` },
    { label: "IMC", value: selectedScan.bmi.toFixed(1) },
    { label: "PGC", value: `${selectedScan.bodyFatPercent.toFixed(1)}%` },
    { label: "Cintura-cadera", value: selectedScan.waistHipRatio.toFixed(2) },
    { label: "Visceral", value: `${selectedScan.visceralFatLevel}` },
    {
      label: "BMR",
      value: `${selectedScan.basalMetabolicRateKcal} kcal`,
    },
    {
      label: "Ingesta sugerida",
      value: selectedScan.recommendedIntakeKcal
        ? `${selectedScan.recommendedIntakeKcal} kcal`
        : "n/d",
    },
    {
      label: "Peso objetivo",
      value: `${selectedScan.targetWeightKg.toFixed(1)} kg`,
    },
    {
      label: "Control de grasa",
      value: `${selectedScan.fatControlKg.toFixed(1)} kg`,
    },
  ];

  const visibleComparisonRows = useMemo(
    () => inbodyComparisonRows.filter((row) => row.latestValue !== row.previousValue),
    [inbodyComparisonRows],
  );

  function buildDraft(day: WorkoutDay) {
    return {
      date: toInputDate(new Date()),
      type: day.session,
      status: day.status === "completed" ? "completado" : "pendiente",
      notes: day.note ?? "",
      exercises: buildExerciseDraft(day.session),
    } satisfies RegistrationDraft;
  }

  function openRegistrationForToday() {
    const freshRoutineView = buildRoutineViewModel(workoutRoutines, new Date());
    const autoWeek =
      freshRoutineView.routines.find((week) => week.id === freshRoutineView.activeWeekId) ??
      selectedWeek;
    const autoIndex = Math.min(
      freshRoutineView.activeDayIndex,
      Math.max(autoWeek.days.length - 1, 0),
    );
    const autoDay = autoWeek.days[autoIndex] ?? selectedDay;
    setWorkoutRoutines(freshRoutineView.routines);
    setSelectedWeekId(autoWeek.id);
    setSelectedDayIndex(autoIndex);
    setSelectedHtmlWeek(freshRoutineView.activeHtmlWeek);
    setRegistrationDraft(buildDraft(autoDay));
    setRegistrationMessage(null);
  }

  function openRegistrationForSelected() {
    setRegistrationDraft(buildDraft(selectedDay));
    setRegistrationMessage(null);
  }

  function closeRegistrationModal() {
    setRegistrationDraft(null);
  }

  function updateDraftExercise(
    index: number,
    patch: Partial<RegistrationExercise>,
  ) {
    setRegistrationDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.map((exercise, exerciseIndex) =>
          exerciseIndex === index ? { ...exercise, ...patch } : exercise,
        ),
      };
    });
  }

  function removeDraftExercise(index: number) {
    setRegistrationDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: current.exercises.filter((_, exerciseIndex) => exerciseIndex !== index),
      };
    });
  }

  function addDraftExercise() {
    setRegistrationDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        exercises: [
          ...current.exercises,
          {
            name: "",
            sets: "",
            reps: "",
            load: "",
            done: true,
          },
        ],
      };
    });
  }

  async function saveRegistration() {
    if (!registrationDraft) {
      return;
    }

    const completedExercises = registrationDraft.exercises.filter((exercise) => exercise.done);
    const summary =
      registrationDraft.status === "completado"
        ? `${completedExercises.length} ejercicios completados`
        : registrationDraft.status;

    const details = registrationDraft.exercises.map((exercise) => {
      const blocks = [
        exercise.done ? "OK" : "Pendiente",
        exercise.name || "Ejercicio sin nombre",
        exercise.sets ? `${exercise.sets} series` : "",
        exercise.reps ? `${exercise.reps} reps` : "",
        exercise.load ? `${exercise.load}` : "",
      ].filter(Boolean);

      return blocks.join(" · ");
    });

    const response = await fetch("/api/health/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        routineWeekId: selectedWeek.id,
        sessionDate: registrationDraft.date,
        sessionType: registrationDraft.type,
        status: registrationDraft.status,
        notes: registrationDraft.notes,
        exercises: registrationDraft.exercises.map((exercise) => ({
          name: exercise.name,
          setsText: exercise.sets,
          repsText: exercise.reps,
          loadText: exercise.load,
          completed: exercise.done,
        })),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setRegistrationMessage(payload.error ?? "No se pudo guardar la sesión.");
      return;
    }

    const newEntry: SessionHistoryItem = {
      id: payload.session.id,
      date: formatDateLabel(registrationDraft.date),
      week: selectedWeek.label.replace("Semana ", "S"),
      session: registrationDraft.type,
      summary,
      notes: registrationDraft.notes,
      details,
    };

    setSessionHistory((current) => [newEntry, ...current]);
    setWeeklyConsistency((current) => incrementConsistencyPoint(current, newEntry.week));
    setWorkoutRoutines((current) =>
      current.map((week) => {
        if (week.id !== selectedWeek.id) {
          return week;
        }

        return {
          ...week,
          statusLabel: "En curso",
          days: week.days.map((day, dayIndex) => {
            if (dayIndex !== selectedDayIndex) {
              return day;
            }

            return {
              ...day,
              status: registrationDraft.status === "pendiente" ? "today" : "completed",
              note:
                registrationDraft.status === "completado"
                  ? "Registrado"
                  : registrationDraft.status === "parcial"
                    ? "Avance parcial"
                    : day.note,
            };
          }),
        };
      }),
    );
    setRegistrationMessage("Sesion guardada en Supabase y agregada al historial.");
    setRegistrationDraft(null);
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {registrationMessage ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            {registrationMessage}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
          <article className="app-card p-8 shadow-[0_16px_48px_rgba(31,27,22,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink)]">
                  Composicion InBody
                </h1>
                <p className="mt-2 text-lg text-[var(--muted)]">
                  Ultima medicion: {latestMeasurement.dateLabel.replace("Ultima medicion: ", "")}
                </p>
              </div>
              <span className="rounded-full bg-[#d9f5ef] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Base inicial
              </span>
            </div>

            <div className="mt-8 grid gap-8 2xl:grid-cols-[210px_minmax(260px,1fr)_minmax(360px,0.9fr)]">
              <div className="flex items-center justify-center">
                <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[14px] border-[#dceff2] bg-white shadow-[inset_0_0_0_1px_rgba(222,224,242,0.6)]">
                  <div
                    className="absolute inset-[-14px] rounded-full"
                    style={{
                      background: `conic-gradient(#0e7a3d 0deg ${Math.round(selectedScan.bodyFatPercent * 3.6)}deg, transparent ${Math.round(selectedScan.bodyFatPercent * 3.6)}deg 360deg)`,
                      WebkitMask:
                        "radial-gradient(circle, transparent 56%, black 57%)",
                      mask: "radial-gradient(circle, transparent 56%, black 57%)",
                    }}
                  />
                  <div className="relative text-center">
                    <div className="text-5xl font-semibold text-[var(--ink)]">
                      {latestMeasurement.bodyFat}
                    </div>
                    <div className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      Body fat
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid content-start gap-5">
                {compositionMetrics.map((metric) => (
                  <MiniMetricBar
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    progress={metric.progress}
                  />
                ))}
              </div>

              <div className="overflow-hidden rounded-[2rem] bg-[#f2f0fb] p-4 sm:p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Tendencia de peso
                </div>
                <div className="mt-5 flex h-[188px] gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:gap-3 sm:overflow-hidden">
                  {weightTrend.map((point) => (
                    <div key={point.label} className="grid min-w-[58px] grid-rows-[1fr_auto_auto] gap-1.5 overflow-hidden sm:min-w-0 sm:gap-2">
                      <div className="flex items-end rounded-[1.2rem] bg-white/70 px-1 pb-1 sm:rounded-[1.5rem] sm:px-1.5 sm:pb-1.5">
                        <div
                          className="w-full rounded-[1rem] bg-gradient-to-t from-[#4d9c8b] to-[#67aa7b]"
                          style={{
                            height: `${chartHeight(point.value, weightMin, weightMax, 126)}px`,
                          }}
                        />
                      </div>
                      <div className="truncate text-center text-[10px] leading-3 text-[var(--muted)] sm:text-xs sm:leading-4">
                        {point.label}
                      </div>
                      <div className="text-center text-[11px] font-semibold leading-3 text-[var(--ink)] sm:text-sm sm:font-medium sm:leading-5">
                        <span className="block sm:inline">{point.value.toFixed(1)}</span>
                        <span className="text-[9px] sm:ml-1 sm:text-sm">kg</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--muted)] sm:text-sm">
                  <span>{(latestScan.weightKg - weightTrend[0].value).toFixed(1)} kg de cambio</span>
                  <span className="font-semibold text-emerald-700">Progreso</span>
                </div>
              </div>
            </div>
          </article>

          <article className="app-card p-8 shadow-[0_16px_48px_rgba(31,27,22,0.05)]">
            <h2 className="text-3xl font-semibold text-[var(--ink)]">Consistencia</h2>
            <p className="hidden">Sesiones por semana</p>

            <div className="relative mt-8 overflow-hidden rounded-[1.5rem] border border-[#e7e4f4] bg-white p-5">
              <div className="pointer-events-none absolute inset-x-5 top-5 bottom-11 grid grid-rows-4">
                {[0, 1, 2, 3].map((line) => (
                  <div
                    key={line}
                    className="border-t border-dashed border-[#e6e3f1]"
                  />
                ))}
              </div>

              <div className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-4">
                <div className="grid h-[190px] grid-rows-4 text-xs text-[var(--muted)]">
                  <span className="self-start">{consistencyMax}</span>
                  <span className="self-center">{Math.round((consistencyMax * 2) / 3)}</span>
                  <span className="self-center">{Math.round(consistencyMax / 3)}</span>
                  <span className="self-end">0</span>
                </div>
                <div className="flex h-[176px] gap-3 overflow-x-auto pb-1">
                  {weeklyConsistency.map((point) => (
                    <div key={point.label} className="grid min-w-12 flex-1 grid-rows-[1fr_auto_auto] gap-2 overflow-hidden">
                      <div className="flex items-end">
                        <div
                          className="w-full rounded-t-[1rem] bg-[#147a3d]"
                          style={{
                            height: `${chartHeight(point.value, consistencyMin, consistencyMax, 132)}px`,
                          }}
                        />
                      </div>
                      <div className="text-center text-xs text-[var(--muted)]">{point.label}</div>
                      <div className="text-center text-sm font-semibold text-[var(--ink)]">
                        {point.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden">
              El patron mas estable del bloque esta entre S10 y S11, con 6 sesiones.
            </div>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <article className="app-card p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-semibold text-[var(--ink)]">Ultimo vs anterior</h2>
                <p className="hidden">
                  {previousScan.label} frente a {latestScan.label}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
                {latestScan.heightCm} cm · {latestScan.age} anos
              </div>
            </div>

            <div className="mt-6 max-h-[620px] space-y-3 overflow-y-auto pr-1">
              {visibleComparisonRows.map((row) => {
                const delta = row.latestValue - row.previousValue;
                const positive = row.betterWhen === "higher" ? delta > 0 : delta < 0;
                const neutral = delta === 0;
                const formatValue = (value: number) => {
                  if (row.unit === "kcal" || row.unit === "niv") {
                    return `${Math.round(value)}${row.unit ? ` ${row.unit}` : ""}`;
                  }

                  const normalized = value.toFixed(1).replace(".0", "");
                  return `${normalized}${row.unit ? ` ${row.unit}` : ""}`;
                };

                return (
                  <div
                    key={row.label}
                    className="grid items-center gap-3 rounded-[1.5rem] border border-[var(--line)] bg-white px-5 py-4 shadow-[0_4px_16px_rgba(31,27,22,0.03)] sm:grid-cols-[minmax(150px,1fr)_minmax(110px,auto)_minmax(110px,auto)_minmax(92px,auto)]"
                  >
                    <div className="font-medium text-[var(--ink)]">{row.label}</div>
                    <div className="text-sm text-[var(--muted)]">Ant: {formatValue(row.previousValue)}</div>
                    <div className="text-sm font-semibold text-[var(--ink)]">Act: {formatValue(row.latestValue)}</div>
                    <div
                      className={`rounded-full px-3 py-1 text-center text-xs font-semibold ${
                        neutral
                          ? "bg-zinc-100 text-zinc-700"
                          : positive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-900"
                      }`}
                    >
                      {formatSignedDelta(delta)}
                      {row.unit ? ` ${row.unit}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="app-card p-8">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--ink)]">Timeline InBody</h2>
              <p className="hidden">
                Lecturas reconstruidas manualmente desde los escaneos originales.
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-[720px] table-fixed border-collapse">
                  <thead className="bg-[#f2f0fb] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3 text-left">Fecha</th>
                      <th className="px-4 py-3 text-left">Peso</th>
                      <th className="px-4 py-3 text-left">Musc.</th>
                      <th className="px-4 py-3 text-left">Grasa</th>
                      <th className="px-4 py-3 text-left">PGC</th>
                      <th className="px-4 py-3 text-left">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.initialData.inbodyScans.map((scan) => (
                      <tr
                        key={scan.id}
                        onClick={() => setSelectedScanId(scan.id)}
                        className={`cursor-pointer border-t border-[var(--line)] text-sm text-[var(--ink)] ${
                          selectedScan.id === scan.id ? "bg-[#edf7f0]" : "bg-transparent"
                        }`}
                      >
                        <td className="px-4 py-3 font-medium">{scan.label}</td>
                        <td className="px-4 py-3">{scan.weightKg.toFixed(1)} kg</td>
                        <td className="px-4 py-3">{scan.skeletalMuscleKg.toFixed(1)} kg</td>
                        <td className="px-4 py-3">{scan.bodyFatMassKg.toFixed(1)} kg</td>
                        <td className="px-4 py-3">{scan.bodyFatPercent.toFixed(1)}%</td>
                        <td className="px-4 py-3">{scan.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Escaneo seleccionado
                  </div>
                  <div className="mt-2 text-4xl font-semibold text-[var(--ink)]">
                    {selectedScan.label}
                  </div>
                </div>
                <div className="text-sm text-[var(--muted)]">
                  {selectedScan.heightCm} cm · {selectedScan.age} anos
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {scanDetails.map((detail) => (
                  <div
                    key={`${selectedScan.id}-${detail.label}`}
                    className="rounded-[1.4rem] border border-[var(--line)] bg-white p-4"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      {detail.label}
                    </div>
                    <div className="mt-3 text-4xl font-semibold leading-tight text-[var(--ink)]">
                      {detail.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <div className="rounded-[1.5rem] border border-[var(--line)] bg-[#faf9ff] p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Masa magra segmental
                  </div>
                  <div className="mt-4 grid gap-3">
                    {selectedLeanSegments.map((segment) => (
                      <div
                        key={`${selectedScan.id}-lean-${segment.label}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[1.1rem] bg-white px-4 py-3"
                      >
                        <div className="font-medium text-[var(--ink)]">{segment.label}</div>
                        <div className="text-sm text-[var(--muted)]">
                          {segment.value.kg.toFixed(2)} kg
                        </div>
                        <div className="text-sm font-semibold text-[var(--ink)]">
                          {segment.value.percent.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[var(--line)] bg-[#faf9ff] p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Grasa segmental
                  </div>
                  <div className="mt-4 grid gap-3">
                    {selectedFatSegments.map((segment) => (
                      <div
                        key={`${selectedScan.id}-fat-${segment.label}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[1.1rem] bg-white px-4 py-3"
                      >
                        <div className="font-medium text-[var(--ink)]">{segment.label}</div>
                        <div className="text-sm text-[var(--muted)]">
                          {segment.value.kg.toFixed(1)} kg
                        </div>
                        <div className="text-sm font-semibold text-[var(--ink)]">
                          {segment.value.percent.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-[#faf9ff] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Impedancia
                </div>
                <div className="mt-4 grid gap-3">
                  {(["z20", "z100"] as const).map((band) => (
                    <article key={`${selectedScan.id}-${band}`} className="rounded-[1.2rem] border border-[var(--line)] bg-white p-4">
                      <div className="text-sm font-semibold text-[var(--ink)]">
                        {band === "z20" ? "20 kHz" : "100 kHz"}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {IMPEDANCE_COLUMNS.map((column) => (
                          <div
                            key={`${band}-${column.key}`}
                            className="rounded-xl bg-[#f2f0fb] px-3 py-2"
                          >
                            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                              {column.label}
                            </div>
                            <div className="mt-1 text-base font-semibold tabular-nums text-[var(--ink)]">
                              {selectedScan.impedance[band][column.key].toFixed(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
          <article className="relative app-card p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-3xl font-semibold text-[var(--ink)]">Semana {selectedWeek.label.replace("Semana ", "")} — {selectedWeek.focus}</h2>
                <p className="hidden">
                  Rutinas ordenadas por bloque y listas para registrar.
                </p>
              </div>
              <button
                type="button"
                onClick={openRegistrationForToday}
                className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(20,122,61,0.18)]"
              >
                Registrar
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {workoutRoutines.map((week) => (
                <button
                  key={week.id}
                  type="button"
                  onClick={() => {
                    setSelectedWeekId(week.id);
                    setSelectedDayIndex(0);
                    const weekNumber = Number(week.label.replace("Semana ", ""));
                    if (routineHtmlWeeks.includes(weekNumber)) {
                      setSelectedHtmlWeek(weekNumber);
                    }
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    week.id === selectedWeek.id
                      ? "bg-emerald-700 text-white"
                      : "border border-[var(--line)] bg-[#f2f0fb] text-[var(--ink)]"
                  }`}
                >
                  {week.label.replace("Semana ", "S")}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-[1.8rem] border border-[var(--line)] bg-white p-5">
              <div className="flex flex-col gap-3">
                {selectedWeek.days.map((day, index) => {
                  const isSelected = day.dayShort === selectedDay.dayShort;

                  return (
                    <button
                      key={`${selectedWeek.id}-${day.dayShort}`}
                      type="button"
                      onClick={() => setSelectedDayIndex(index)}
                      className={`flex w-full items-center gap-4 rounded-[1.5rem] border px-4 py-4 text-left transition ${
                        isSelected
                          ? "border-emerald-700 bg-[#eef8f1]"
                          : "border-transparent bg-[#fbfbff] hover:border-[var(--line)]"
                      }`}
                    >
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.15rem] text-sm font-semibold ${
                          isSelected ? "bg-emerald-700 text-white" : "bg-[#eceaf8] text-[#6e6a85]"
                        }`}
                      >
                        {day.dayShort}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-2xl font-semibold text-[var(--ink)]">{day.session}</div>
                        <div className="mt-1 text-sm text-[var(--muted)]">{day.dayName}</div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${STATUS_STYLE[day.status]}`}>
                        {day.note ?? day.status}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {registrationDraft ? (
              <div
                className="fixed inset-0 z-50 flex items-end bg-black/35 p-0 backdrop-blur-[2px] sm:items-center sm:justify-center sm:p-6"
                role="dialog"
                aria-modal="true"
                aria-labelledby="registration-modal-title"
                onClick={closeRegistrationModal}
              >
                <div
                  className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[1.75rem] border border-[var(--line)] bg-white shadow-[0_30px_100px_rgba(27,25,39,0.28)] sm:max-w-2xl sm:rounded-[2rem]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-white px-5 py-4 sm:px-6 sm:py-5">
                    <h2 id="registration-modal-title" className="text-xl font-semibold text-[var(--ink)] sm:text-2xl">
                      Registrar sesion
                    </h2>
                    <button
                      type="button"
                      onClick={closeRegistrationModal}
                      className="h-10 w-10 rounded-full text-[0px] text-[var(--muted)] transition after:text-xl after:content-['x'] hover:bg-[#f2f0fb]"
                      aria-label="Cerrar registro"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ModalField label="Tipo">
                        <select
                          value={registrationDraft.type}
                          onChange={(event) =>
                            setRegistrationDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    type: event.target.value,
                                    exercises: buildExerciseDraft(event.target.value),
                                  }
                                : current,
                            )
                          }
                          className="h-12 rounded-[1.1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
                        >
                          {Object.keys(routineTemplates).map((template) => (
                            <option key={template} value={template}>
                              {template}
                            </option>
                          ))}
                        </select>
                      </ModalField>

                      <ModalField label="Estado">
                        <select
                          value={registrationDraft.status}
                          onChange={(event) =>
                            setRegistrationDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    status: event.target.value as RegistrationDraft["status"],
                                  }
                                : current,
                            )
                          }
                          className="h-12 rounded-[1.1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
                        >
                          <option value="completado">Completado</option>
                          <option value="parcial">Parcial</option>
                          <option value="pendiente">Pendiente</option>
                        </select>
                      </ModalField>
                    </div>

                    <ModalField label="Notas (opcional)">
                      <input
                        type="text"
                        value={registrationDraft.notes}
                        onChange={(event) =>
                          setRegistrationDraft((current) =>
                            current ? { ...current, notes: event.target.value } : current,
                          )
                        }
                        className="h-12 rounded-[1.1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
                        placeholder="ej: buen ritmo, subi peso en press..."
                      />
                    </ModalField>

                    <ModalField label="Fecha">
                      <input
                        type="date"
                        value={registrationDraft.date}
                        onChange={(event) =>
                          setRegistrationDraft((current) =>
                            current ? { ...current, date: event.target.value } : current,
                          )
                        }
                        className="h-12 rounded-[1.1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
                      />
                    </ModalField>

                    <ModalField
                      label="Ejercicios"
                      action={
                        <button
                          type="button"
                          onClick={addDraftExercise}
                          className="text-sm font-semibold text-emerald-700"
                        >
                          + Agregar
                        </button>
                      }
                    >
                      <div className="space-y-4">
                        {registrationDraft.exercises.map((exercise, index) => (
                          <div
                            key={`exercise-${index}`}
                            className="rounded-[1.5rem] bg-[#f2f0fb] p-4"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="text"
                                value={exercise.name}
                                onChange={(event) =>
                                  updateDraftExercise(index, { name: event.target.value })
                                }
                                className="h-12 flex-1 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
                                placeholder="Nombre del ejercicio"
                              />
                              <button
                                type="button"
                                onClick={() => removeDraftExercise(index)}
                                className="text-[0px] text-rose-500 after:text-lg after:content-['x']"
                                aria-label={`Eliminar ${exercise.name || "ejercicio"}`}
                              >
                                ×
                              </button>
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr_140px_90px]">
                              <input
                                type="text"
                                value={exercise.sets}
                                onChange={(event) =>
                                  updateDraftExercise(index, { sets: event.target.value })
                                }
                                className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 text-center outline-none focus:border-emerald-600"
                                placeholder="Series"
                              />
                              <input
                                type="text"
                                value={exercise.reps}
                                onChange={(event) =>
                                  updateDraftExercise(index, { reps: event.target.value })
                                }
                                className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 text-center outline-none focus:border-emerald-600"
                                placeholder="Reps"
                              />
                              <input
                                type="text"
                                value={exercise.load}
                                onChange={(event) =>
                                  updateDraftExercise(index, { load: event.target.value })
                                }
                                className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 text-center outline-none focus:border-emerald-600"
                                placeholder="Carga"
                              />
                              <label className="flex items-center justify-center gap-2 rounded-[1rem] border border-[var(--line)] bg-white px-3 text-sm text-[var(--muted)]">
                                <input
                                  type="checkbox"
                                  checked={exercise.done}
                                  onChange={(event) =>
                                    updateDraftExercise(index, { done: event.target.checked })
                                  }
                                />
                                OK
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ModalField>
                  </div>

                  <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[var(--line)] bg-white px-5 py-4 sm:px-6 sm:py-5">
                    <button
                      type="button"
                      onClick={closeRegistrationModal}
                      className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={saveRegistration}
                      className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </article>

          <aside className="app-card p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Sesion seleccionada
                </div>
                <h3 className="mt-3 text-3xl font-semibold text-[var(--ink)]">
                  {selectedDay.session}
                </h3>
              </div>
              <button
                type="button"
                onClick={openRegistrationForSelected}
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]"
              >
                Usar seleccion
              </button>
            </div>

            <p className="mt-3 text-base text-[var(--muted)]">
              {selectedDay.dayName} · {selectedWeek.label} · {selectedWeek.focus}
            </p>

            <div className="mt-6 space-y-3">
              {selectedExercises.map((exercise) => (
                <article
                  key={`${selectedDay.session}-${exercise.name}`}
                  className="rounded-[1.4rem] border border-[var(--line)] bg-[#fbfbff] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-[var(--ink)]">{exercise.name}</div>
                    <div className="rounded-full bg-[#eceaf8] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
                      {exercise.series}
                    </div>
                  </div>
                  {exercise.load ? (
                    <div className="mt-2 text-sm text-[var(--muted)]">Carga: {exercise.load}</div>
                  ) : null}
                  {exercise.notes ? (
                    <div className="mt-1 text-sm text-[var(--muted)]">{exercise.notes}</div>
                  ) : null}
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="app-card p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--ink)]">Rutinas HTML</h2>
              <p className="hidden">
                Rescatado desde tu dashboard anterior para seguir viendo la version que ya te gustaba.
              </p>
            </div>
            <a
              href={`/rutina_semana${selectedHtmlWeek}.html`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)]"
            >
              Abrir en pestana
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {routineHtmlWeeks.map((week) => (
              <button
                key={week}
                type="button"
                onClick={() => setSelectedHtmlWeek(week)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedHtmlWeek === week
                    ? "bg-emerald-700 text-white"
                    : "border border-[var(--line)] bg-[#f2f0fb] text-[var(--ink)]"
                }`}
              >
                S{week}
              </button>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white">
            <iframe
              key={selectedHtmlWeek}
              src={`/rutina_semana${selectedHtmlWeek}.html`}
              title={`Rutina semana ${selectedHtmlWeek}`}
              className="h-[640px] w-full md:h-[820px]"
            />
          </div>
        </section>

        <section className="app-card p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--ink)]">Historial de sesiones</h2>
              <p className="hidden">
                Base parcial rescatada desde scripts antiguos.
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
              {sessionHistory.length} sesiones visibles
            </div>
          </div>

          <div className="mt-6 max-h-[720px] overflow-y-auto pr-2">
            <div className="flex flex-col gap-3">
              {sessionHistory.map((item) => (
                <details
                  key={item.id}
                  className="rounded-[1.5rem] border border-[var(--line)] bg-white p-4"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#d9f5ef] px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {item.date}
                    </span>
                    <span className="text-sm text-[var(--muted)]">{item.week}</span>
                    <span className="text-lg font-semibold text-[var(--ink)]">{item.session}</span>
                    <span className="ml-auto text-sm text-[var(--muted)]">{item.summary}</span>
                  </summary>

                  <div className="mt-4 grid gap-3 border-t border-[var(--line)] pt-4">
                    {item.notes ? (
                      <p className="text-sm text-[var(--muted)]">{item.notes}</p>
                    ) : null}
                    {item.details.map((detail) => (
                      <div
                        key={`${item.id}-${detail}`}
                        className="rounded-[1.2rem] bg-[#f2f0fb] px-4 py-3 text-sm text-[var(--muted)]"
                      >
                        {detail}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>

      
    </>
  );
}
