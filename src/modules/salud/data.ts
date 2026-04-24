import generatedHistory from "@/modules/salud/generated-history.json";

export type HealthStat = {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "warning";
};

export type CompositionMetric = {
  label: string;
  value: string;
  progress: number;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type ConsistencyPoint = {
  label: string;
  value: number;
};

export type WorkoutExercise = {
  name: string;
  series: string;
  load?: string;
  notes?: string;
};

export type WorkoutDay = {
  dayShort: string;
  dayName: string;
  session: string;
  status: "completed" | "today" | "upcoming" | "rest";
  note?: string;
};

export type WorkoutWeek = {
  id: string;
  label: string;
  focus: string;
  statusLabel: string;
  days: WorkoutDay[];
};

export type SessionHistoryItem = {
  id: string;
  date: string;
  week: string;
  session: string;
  summary: string;
  notes?: string;
  details: string[];
};

export type InBodyComparisonRow = {
  label: string;
  latestValue: number;
  previousValue: number;
  unit: string;
  betterWhen: "higher" | "lower";
};

export type InBodyScan = {
  id: string;
  date: string;
  label: string;
  heightCm: number;
  age: number;
  weightKg: number;
  bodyWaterL: number;
  proteinsKg: number;
  mineralsKg: number;
  bodyFatMassKg: number;
  skeletalMuscleKg: number;
  bodyFatPercent: number;
  bmi: number;
  score: number;
  targetWeightKg: number;
  weightControlKg: number;
  fatControlKg: number;
  muscleControlKg: number;
  waistHipRatio: number;
  visceralFatLevel: number;
  obesityDegree: number;
  basalMetabolicRateKcal: number;
  fatFreeMassKg: number;
  imeKgM2: number;
};

export const inbodyScans: InBodyScan[] = [
  {
    id: "2024-07-23",
    date: "2024-07-23",
    label: "23 jul 2024",
    heightCm: 174,
    age: 36,
    weightKg: 92.8,
    bodyWaterL: 48.8,
    proteinsKg: 13.3,
    mineralsKg: 4.4,
    bodyFatMassKg: 26.3,
    skeletalMuscleKg: 38.0,
    bodyFatPercent: 28.3,
    bmi: 30.7,
    score: 75,
    targetWeightKg: 78.3,
    weightControlKg: -14.5,
    fatControlKg: -14.5,
    muscleControlKg: 0,
    waistHipRatio: 1.01,
    visceralFatLevel: 11,
    obesityDegree: 0,
    basalMetabolicRateKcal: 1807,
    fatFreeMassKg: 66.5,
    imeKgM2: 9.0,
  },
  {
    id: "2025-06-28",
    date: "2025-06-28",
    label: "28 jun 2025",
    heightCm: 174,
    age: 37,
    weightKg: 86.9,
    bodyWaterL: 46.9,
    proteinsKg: 12.7,
    mineralsKg: 4.36,
    bodyFatMassKg: 22.9,
    skeletalMuscleKg: 36.5,
    bodyFatPercent: 26.4,
    bmi: 28.7,
    score: 76,
    targetWeightKg: 75.3,
    weightControlKg: -11.6,
    fatControlKg: -11.6,
    muscleControlKg: 0,
    waistHipRatio: 0.98,
    visceralFatLevel: 10,
    obesityDegree: 0,
    basalMetabolicRateKcal: 1752,
    fatFreeMassKg: 64.0,
    imeKgM2: 8.6,
  },
  {
    id: "2025-11-23",
    date: "2025-11-23",
    label: "23 nov 2025",
    heightCm: 174,
    age: 37,
    weightKg: 92.2,
    bodyWaterL: 49.5,
    proteinsKg: 13.5,
    mineralsKg: 4.51,
    bodyFatMassKg: 24.7,
    skeletalMuscleKg: 38.6,
    bodyFatPercent: 26.8,
    bmi: 30.5,
    score: 78,
    targetWeightKg: 79.4,
    weightControlKg: -12.8,
    fatControlKg: -12.8,
    muscleControlKg: 0,
    waistHipRatio: 1.0,
    visceralFatLevel: 11,
    obesityDegree: 0,
    basalMetabolicRateKcal: 1827,
    fatFreeMassKg: 67.5,
    imeKgM2: 9.1,
  },
  {
    id: "2026-03-10",
    date: "2026-03-10",
    label: "10 mar 2026",
    heightCm: 175,
    age: 38,
    weightKg: 90.0,
    bodyWaterL: 50.1,
    proteinsKg: 13.6,
    mineralsKg: 4.56,
    bodyFatMassKg: 21.8,
    skeletalMuscleKg: 39.0,
    bodyFatPercent: 24.2,
    bmi: 29.4,
    score: 81,
    targetWeightKg: 80.3,
    weightControlKg: -9.7,
    fatControlKg: -9.7,
    muscleControlKg: 0,
    waistHipRatio: 0.94,
    visceralFatLevel: 9,
    obesityDegree: 134,
    basalMetabolicRateKcal: 1844,
    fatFreeMassKg: 0,
    imeKgM2: 0,
  },
  {
    id: "2026-04-16",
    date: "2026-04-16",
    label: "16 abr 2026",
    heightCm: 175,
    age: 38,
    weightKg: 91.2,
    bodyWaterL: 50.7,
    proteinsKg: 13.8,
    mineralsKg: 4.61,
    bodyFatMassKg: 22.2,
    skeletalMuscleKg: 39.6,
    bodyFatPercent: 24.3,
    bmi: 29.8,
    score: 81,
    targetWeightKg: 81.2,
    weightControlKg: -10.0,
    fatControlKg: -10.0,
    muscleControlKg: 0,
    waistHipRatio: 0.97,
    visceralFatLevel: 10,
    obesityDegree: 135,
    basalMetabolicRateKcal: 1861,
    fatFreeMassKg: 0,
    imeKgM2: 0,
  },
];

const latestScan = inbodyScans[inbodyScans.length - 1];
const previousScan = inbodyScans[inbodyScans.length - 2];

export const inbodyComparisonRows: InBodyComparisonRow[] = [
  {
    label: "Peso",
    latestValue: latestScan.weightKg,
    previousValue: previousScan.weightKg,
    unit: "kg",
    betterWhen: "lower",
  },
  {
    label: "Masa muscular",
    latestValue: latestScan.skeletalMuscleKg,
    previousValue: previousScan.skeletalMuscleKg,
    unit: "kg",
    betterWhen: "higher",
  },
  {
    label: "Masa grasa",
    latestValue: latestScan.bodyFatMassKg,
    previousValue: previousScan.bodyFatMassKg,
    unit: "kg",
    betterWhen: "lower",
  },
  {
    label: "PGC",
    latestValue: latestScan.bodyFatPercent,
    previousValue: previousScan.bodyFatPercent,
    unit: "%",
    betterWhen: "lower",
  },
  {
    label: "Grasa visceral",
    latestValue: latestScan.visceralFatLevel,
    previousValue: previousScan.visceralFatLevel,
    unit: "niv",
    betterWhen: "lower",
  },
  {
    label: "BMR",
    latestValue: latestScan.basalMetabolicRateKcal,
    previousValue: previousScan.basalMetabolicRateKcal,
    unit: "kcal",
    betterWhen: "higher",
  },
  {
    label: "Score InBody",
    latestValue: latestScan.score,
    previousValue: previousScan.score,
    unit: "pts",
    betterWhen: "higher",
  },
];

export const healthSummaryStats: HealthStat[] = [
  {
    label: "Peso actual",
    value: `${latestScan.weightKg.toFixed(1)} kg`,
    detail: `${latestScan.bodyFatPercent.toFixed(1)}% grasa corporal`,
  },
  {
    label: "Masa muscular",
    value: `${latestScan.skeletalMuscleKg.toFixed(1)} kg`,
    detail: `BMR: ${latestScan.basalMetabolicRateKcal} kcal`,
  },
  {
    label: "Grasa visceral",
    value: `${latestScan.visceralFatLevel}`,
    detail: "Objetivo: 8 o menos",
    tone: latestScan.visceralFatLevel > 8 ? "warning" : "default",
  },
  {
    label: "Score InBody",
    value: `${latestScan.score} pts`,
    detail: `Cambio reciente: ${(latestScan.score - previousScan.score) >= 0 ? "+" : ""}${latestScan.score - previousScan.score}`,
  },
];

export const latestMeasurement = {
  title: "Composicion InBody",
  dateLabel: `Ultima medicion: ${latestScan.label}`,
  bodyFat: `${latestScan.bodyFatPercent.toFixed(1)}%`,
  bodyFatLabel: "Body fat",
};

export const compositionMetrics: CompositionMetric[] = [
  {
    label: "Masa muscular",
    value: `${latestScan.skeletalMuscleKg.toFixed(1)} kg`,
    progress: 79,
  },
  {
    label: "Masa grasa",
    value: `${latestScan.bodyFatMassKg.toFixed(1)} kg`,
    progress: 52,
  },
  {
    label: "Score InBody",
    value: `${latestScan.score} pts`,
    progress: latestScan.score,
  },
];

export const weightTrend: TrendPoint[] = inbodyScans.map((scan) => ({
  label: scan.label,
  value: scan.weightKg,
}));

export const weeklyConsistency: ConsistencyPoint[] = [
  ...(generatedHistory.weeklyConsistency as ConsistencyPoint[]),
];

export const workoutRoutines: WorkoutWeek[] = [
  {
    id: "s12",
    label: "Semana 12",
    focus: "PPL + carrera",
    statusLabel: "En curso",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push A", status: "completed" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "completed" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna", status: "completed" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull A", status: "today", note: "Hoy" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest", note: "Recuperacion" },
    ],
  },
  {
    id: "s13",
    label: "Semana 13",
    focus: "Rotacion B",
    statusLabel: "Siguiente bloque",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push B", status: "upcoming" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna", status: "upcoming" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull B", status: "upcoming" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s14",
    label: "Semana 14",
    focus: "Vuelta a A",
    statusLabel: "Plantilla",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push A", status: "upcoming" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna", status: "upcoming" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull A", status: "upcoming" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
];

export const routineTemplates: Record<string, WorkoutExercise[]> = {
  "Push A": [
    { name: "Press de banca plano (barra)", series: "4 x 8-12", load: "50 kg" },
    { name: "Press inclinado con mancuernas", series: "3 x 10-12", load: "20 kg c/u" },
    { name: "Press militar con barra", series: "4 x 10", load: "30 kg" },
    { name: "Elevaciones laterales", series: "4 x 12-15", load: "10 kg c/u" },
    { name: "Aperturas con mancuernas", series: "3 x 12-15", load: "17.5 kg c/u" },
  ],
  "Push B": [
    { name: "Press inclinado con barra", series: "4 x 8-12", load: "38 kg" },
    { name: "Dips en paralelas", series: "3 x 8-12", notes: "Corporal" },
    { name: "Press de hombro sentado", series: "3 x 10-12", load: "15 kg c/u" },
    { name: "Elevaciones laterales sentado", series: "4 x 15", load: "7.5 kg c/u" },
    { name: "Skullcrusher EZ + press cerrado", series: "3 x 10+10", load: "20 kg" },
  ],
  "Pull A": [
    { name: "Dominadas sin banda", series: "4 x 5", notes: "Objetivo minimo de reps limpias" },
    { name: "T-bar row", series: "4 x 8-10", load: "35 kg" },
    { name: "Remo unilateral con mancuerna", series: "3 x 10-12", load: "28 kg c/u" },
    { name: "Face pulls", series: "4 x 15-20", load: "25 kg" },
    { name: "Curl EZ en banco predicador", series: "3 x 10-12", load: "20 kg" },
    { name: "Curl martillo con mancuernas", series: "3 x 10-12", load: "15 kg c/u" },
  ],
  "Pull B": [
    { name: "Jalon supino", series: "4 x 8-12", load: "Moderado" },
    { name: "Remo pecho apoyado", series: "4 x 10-12", load: "Moderado" },
    { name: "Pullover en polea", series: "3 x 12-15" },
    { name: "Face pulls", series: "4 x 15-20" },
    { name: "Curl inclinado", series: "3 x 10-12" },
    { name: "Curl martillo", series: "3 x 10-12" },
  ],
  Pierna: [
    { name: "Goblet squat con mancuerna", series: "4 x 10-12", load: "22.5 kg" },
    { name: "Romanian deadlift con mancuernas", series: "4 x 10-12", load: "22.5 kg c/u" },
    { name: "Hip thrust con barra", series: "4 x 12-15", load: "57.5-60 kg" },
    { name: "Curl de isquio en maquina", series: "3 x 12-15", load: "50 lbs" },
    { name: "Elevaciones de talon excentricas", series: "4 x 15", notes: "Corporal" },
    { name: "Extension terminal de rodilla", series: "3 x 15", notes: "Banda ligera" },
    { name: "Abductor en maquina", series: "3 x 15-20", load: "85 lbs" },
    { name: "Aductor en maquina", series: "2 x 15-20", load: "80 lbs" },
  ],
  "Cardio Z2": [
    { name: "Caminadora Z2", series: "1 bloque", notes: "47 min · 8 km/h · pendiente 3.5%" },
  ],
  Carrera: [
    { name: "Carrera facil Z2", series: "1 bloque", notes: "6 km · FC 118-138 · ritmo comodo" },
  ],
  "Tirada Larga": [
    { name: "Tirada larga", series: "1 bloque", notes: "12 km · ritmo 6:30-7:00/km · FC <145" },
  ],
  Descanso: [
    { name: "Descanso activo", series: "Opcional", notes: "Movilidad, caminar y recuperacion" },
  ],
};

export const sessionHistory: SessionHistoryItem[] = [
  ...([...(generatedHistory.sessionHistory as SessionHistoryItem[])].reverse()),
];

export const routineHtmlWeeks = [
  5, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
];
