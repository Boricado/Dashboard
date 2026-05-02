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

export type HealthPagePayload = {
  inbodyScans: InBodyScan[];
  sessionHistory: SessionHistoryItem[];
  weeklyConsistency: ConsistencyPoint[];
  workoutRoutines: WorkoutWeek[];
};

export const routinePlanAnchor = {
  weekNumber: 12,
  weekStartDate: "2026-04-20",
} as const;

export type InBodyComparisonRow = {
  label: string;
  latestValue: number;
  previousValue: number;
  unit: string;
  betterWhen: "higher" | "lower";
};

export type InBodySegmentPoint = {
  kg: number;
  percent: number;
};

export type InBodySegmentalAnalysis = {
  leftArm: InBodySegmentPoint;
  rightArm: InBodySegmentPoint;
  trunk: InBodySegmentPoint;
  leftLeg: InBodySegmentPoint;
  rightLeg: InBodySegmentPoint;
};

export type InBodyImpedanceSnapshot = {
  z20: {
    bd: number;
    bi: number;
    tr: number;
    pd: number;
    pi: number;
  };
  z100: {
    bd: number;
    bi: number;
    tr: number;
    pd: number;
    pi: number;
  };
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
  recommendedIntakeKcal?: number;
  segmentalLean: InBodySegmentalAnalysis;
  segmentalFat: InBodySegmentalAnalysis;
  impedance: InBodyImpedanceSnapshot;
  fileName?: string | null;
  filePath?: string | null;
  fileMimeType?: string | null;
  fileSize?: number | null;
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
    recommendedIntakeKcal: 2500,
    segmentalLean: {
      leftArm: { kg: 4.08, percent: 116.4 },
      rightArm: { kg: 4.09, percent: 116.8 },
      trunk: { kg: 30.7, percent: 110.2 },
      leftLeg: { kg: 9.61, percent: 98.7 },
      rightLeg: { kg: 9.55, percent: 98.1 },
    },
    segmentalFat: {
      leftArm: { kg: 1.7, percent: 279.8 },
      rightArm: { kg: 1.7, percent: 276.6 },
      trunk: { kg: 15.0, percent: 355.0 },
      leftLeg: { kg: 3.3, percent: 191.2 },
      rightLeg: { kg: 3.3, percent: 190.5 },
    },
    impedance: {
      z20: { bd: 269.1, bi: 269.4, tr: 21.6, pd: 249.6, pi: 245.0 },
      z100: { bd: 235.7, bi: 237.4, tr: 17.7, pd: 219.2, pi: 213.4 },
    },
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
    recommendedIntakeKcal: 2386,
    segmentalLean: {
      leftArm: { kg: 3.81, percent: 111.1 },
      rightArm: { kg: 3.79, percent: 110.7 },
      trunk: { kg: 29.1, percent: 106.7 },
      leftLeg: { kg: 9.32, percent: 97.8 },
      rightLeg: { kg: 9.25, percent: 97.1 },
    },
    segmentalFat: {
      leftArm: { kg: 1.4, percent: 231.8 },
      rightArm: { kg: 1.4, percent: 231.8 },
      trunk: { kg: 12.9, percent: 306.4 },
      leftLeg: { kg: 3.0, percent: 172.0 },
      rightLeg: { kg: 2.9, percent: 171.5 },
    },
    impedance: {
      z20: { bd: 285.7, bi: 284.0, tr: 22.2, pd: 260.8, pi: 255.1 },
      z100: { bd: 252.6, bi: 252.0, tr: 18.2, pd: 228.2, pi: 222.0 },
    },
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
    recommendedIntakeKcal: 2480,
    segmentalLean: {
      leftArm: { kg: 4.19, percent: 120.0 },
      rightArm: { kg: 4.16, percent: 119.1 },
      trunk: { kg: 31.2, percent: 112.0 },
      leftLeg: { kg: 9.68, percent: 99.7 },
      rightLeg: { kg: 9.64, percent: 99.3 },
    },
    segmentalFat: {
      leftArm: { kg: 1.5, percent: 248.6 },
      rightArm: { kg: 1.5, percent: 251.5 },
      trunk: { kg: 14.2, percent: 336.1 },
      leftLeg: { kg: 3.1, percent: 179.5 },
      rightLeg: { kg: 3.1, percent: 179.6 },
    },
    impedance: {
      z20: { bd: 260.4, bi: 258.0, tr: 21.4, pd: 241.5, pi: 237.7 },
      z100: { bd: 228.8, bi: 226.9, tr: 17.3, pd: 212.2, pi: 207.9 },
    },
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
    fatFreeMassKg: 68.2,
    imeKgM2: 0,
    segmentalLean: {
      leftArm: { kg: 4.11, percent: 124.9 },
      rightArm: { kg: 4.11, percent: 123.9 },
      trunk: { kg: 30.7, percent: 111.6 },
      leftLeg: { kg: 10.11, percent: 100.6 },
      rightLeg: { kg: 9.9, percent: 98.7 },
    },
    segmentalFat: {
      leftArm: { kg: 1.2, percent: 202.8 },
      rightArm: { kg: 1.2, percent: 205.3 },
      trunk: { kg: 12.2, percent: 286.7 },
      leftLeg: { kg: 2.9, percent: 165.2 },
      rightLeg: { kg: 2.9, percent: 164.8 },
    },
    impedance: {
      z20: { bd: 260.7, bi: 261.4, tr: 21.3, pd: 229.4, pi: 218.8 },
      z100: { bd: 227.9, bi: 229.0, tr: 17.8, pd: 200.9, pi: 191.1 },
    },
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
    fatFreeMassKg: 69.0,
    imeKgM2: 0,
    segmentalLean: {
      leftArm: { kg: 4.31, percent: 129.3 },
      rightArm: { kg: 4.31, percent: 129.7 },
      trunk: { kg: 31.8, percent: 115.0 },
      leftLeg: { kg: 9.81, percent: 97.2 },
      rightLeg: { kg: 9.81, percent: 96.4 },
    },
    segmentalFat: {
      leftArm: { kg: 1.3, percent: 206.9 },
      rightArm: { kg: 1.2, percent: 205.9 },
      trunk: { kg: 12.8, percent: 300.2 },
      leftLeg: { kg: 2.7, percent: 157.8 },
      rightLeg: { kg: 2.7, percent: 157.4 },
    },
    impedance: {
      z20: { bd: 254.0, bi: 258.3, tr: 21.1, pd: 245.0, pi: 239.8 },
      z100: { bd: 222.0, bi: 226.4, tr: 17.6, pd: 213.4, pi: 207.4 },
    },
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
    label: "Agua corporal",
    latestValue: latestScan.bodyWaterL,
    previousValue: previousScan.bodyWaterL,
    unit: "L",
    betterWhen: "higher",
  },
  {
    label: "Proteinas",
    latestValue: latestScan.proteinsKg,
    previousValue: previousScan.proteinsKg,
    unit: "kg",
    betterWhen: "higher",
  },
  {
    label: "Minerales",
    latestValue: latestScan.mineralsKg,
    previousValue: previousScan.mineralsKg,
    unit: "kg",
    betterWhen: "higher",
  },
  {
    label: "Masa muscular",
    latestValue: latestScan.skeletalMuscleKg,
    previousValue: previousScan.skeletalMuscleKg,
    unit: "kg",
    betterWhen: "higher",
  },
  {
    label: "Masa libre de grasa",
    latestValue: latestScan.fatFreeMassKg,
    previousValue: previousScan.fatFreeMassKg,
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
    label: "IMC",
    latestValue: latestScan.bmi,
    previousValue: previousScan.bmi,
    unit: "",
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
    label: "Cintura-cadera",
    latestValue: latestScan.waistHipRatio,
    previousValue: previousScan.waistHipRatio,
    unit: "",
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
    label: "Grado de obesidad",
    latestValue: latestScan.obesityDegree,
    previousValue: previousScan.obesityDegree,
    unit: "%",
    betterWhen: "lower",
  },
  {
    label: "Peso objetivo",
    latestValue: latestScan.targetWeightKg,
    previousValue: previousScan.targetWeightKg,
    unit: "kg",
    betterWhen: "lower",
  },
  {
    label: "Control de peso",
    latestValue: latestScan.weightControlKg,
    previousValue: previousScan.weightControlKg,
    unit: "kg",
    betterWhen: "higher",
  },
  {
    label: "Control de grasa",
    latestValue: latestScan.fatControlKg,
    previousValue: previousScan.fatControlKg,
    unit: "kg",
    betterWhen: "higher",
  },
  {
    label: "Control muscular",
    latestValue: latestScan.muscleControlKg,
    previousValue: previousScan.muscleControlKg,
    unit: "kg",
    betterWhen: "higher",
  },
  {
    label: "BMR",
    latestValue: latestScan.basalMetabolicRateKcal,
    previousValue: previousScan.basalMetabolicRateKcal,
    unit: "kcal",
    betterWhen: "higher",
  },
  {
    label: "Brazo izq. magro",
    latestValue: latestScan.segmentalLean.leftArm.kg,
    previousValue: previousScan.segmentalLean.leftArm.kg,
    unit: "kg",
    betterWhen: "higher",
  },
  {
    label: "Brazo der. magro",
    latestValue: latestScan.segmentalLean.rightArm.kg,
    previousValue: previousScan.segmentalLean.rightArm.kg,
    unit: "kg",
    betterWhen: "higher",
  },
  {
    label: "Tronco magro",
    latestValue: latestScan.segmentalLean.trunk.kg,
    previousValue: previousScan.segmentalLean.trunk.kg,
    unit: "kg",
    betterWhen: "higher",
  },
  {
    label: "Pierna izq. magra",
    latestValue: latestScan.segmentalLean.leftLeg.kg,
    previousValue: previousScan.segmentalLean.leftLeg.kg,
    unit: "kg",
    betterWhen: "higher",
  },
  {
    label: "Pierna der. magra",
    latestValue: latestScan.segmentalLean.rightLeg.kg,
    previousValue: previousScan.segmentalLean.rightLeg.kg,
    unit: "kg",
    betterWhen: "higher",
  },
  {
    label: "Brazo izq. grasa",
    latestValue: latestScan.segmentalFat.leftArm.kg,
    previousValue: previousScan.segmentalFat.leftArm.kg,
    unit: "kg",
    betterWhen: "lower",
  },
  {
    label: "Brazo der. grasa",
    latestValue: latestScan.segmentalFat.rightArm.kg,
    previousValue: previousScan.segmentalFat.rightArm.kg,
    unit: "kg",
    betterWhen: "lower",
  },
  {
    label: "Tronco grasa",
    latestValue: latestScan.segmentalFat.trunk.kg,
    previousValue: previousScan.segmentalFat.trunk.kg,
    unit: "kg",
    betterWhen: "lower",
  },
  {
    label: "Pierna izq. grasa",
    latestValue: latestScan.segmentalFat.leftLeg.kg,
    previousValue: previousScan.segmentalFat.leftLeg.kg,
    unit: "kg",
    betterWhen: "lower",
  },
  {
    label: "Pierna der. grasa",
    latestValue: latestScan.segmentalFat.rightLeg.kg,
    previousValue: previousScan.segmentalFat.rightLeg.kg,
    unit: "kg",
    betterWhen: "lower",
  },
  {
    label: "Impedancia 20k BD",
    latestValue: latestScan.impedance.z20.bd,
    previousValue: previousScan.impedance.z20.bd,
    unit: "",
    betterWhen: "lower",
  },
  {
    label: "Impedancia 20k BI",
    latestValue: latestScan.impedance.z20.bi,
    previousValue: previousScan.impedance.z20.bi,
    unit: "",
    betterWhen: "lower",
  },
  {
    label: "Impedancia 100k BD",
    latestValue: latestScan.impedance.z100.bd,
    previousValue: previousScan.impedance.z100.bd,
    unit: "",
    betterWhen: "lower",
  },
  {
    label: "Impedancia 100k BI",
    latestValue: latestScan.impedance.z100.bi,
    previousValue: previousScan.impedance.z100.bi,
    unit: "",
    betterWhen: "lower",
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
  title: "Composición InBody",
  dateLabel: `Última medición: ${latestScan.label}`,
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
    focus: "Descarga y recuperacion",
    statusLabel: "Ajustada",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push suave", status: "upcoming", note: "70-80%" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "5-6 km Z2" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna descarga", status: "upcoming", note: "sin fallo" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "35-45 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull A", status: "upcoming", note: "suave" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "8-9 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest", note: "descanso real" },
    ],
  },
  {
    id: "s15",
    label: "Semana 15",
    focus: "Base 10K",
    statusLabel: "Plan 21K",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push B", status: "upcoming" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "6 km Z2" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna", status: "upcoming", note: "controlado" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "45 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull B", status: "upcoming" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "10 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s16",
    label: "Semana 16",
    focus: "Base 11K",
    statusLabel: "Plan 21K",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push A", status: "upcoming" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "7 km Z2" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna", status: "upcoming", note: "sin fallo" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "45-50 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull A", status: "upcoming" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "11 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s17",
    label: "Semana 17",
    focus: "Descarga",
    statusLabel: "Plan 21K",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push suave", status: "upcoming", note: "70%" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "5 km Z2" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna descarga", status: "upcoming", note: "movilidad" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "35-40 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull A", status: "upcoming", note: "suave" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "8 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s18",
    label: "Semana 18",
    focus: "Construccion 12K",
    statusLabel: "Plan 21K",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push B", status: "upcoming" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "7 km Z2" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna", status: "upcoming", note: "moderado" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "50 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull B", status: "upcoming" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "12 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s19",
    label: "Semana 19",
    focus: "Construccion 13K",
    statusLabel: "Plan 21K",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push A", status: "upcoming" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "8 km Z2" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna", status: "upcoming", note: "sin fallo" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "50 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull A", status: "upcoming" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "13 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s20",
    label: "Semana 20",
    focus: "Descarga",
    statusLabel: "Plan 21K",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push suave", status: "upcoming", note: "70%" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "6 km Z2" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna descarga", status: "upcoming", note: "ligero" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "40 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull B", status: "upcoming", note: "suave" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "10 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s21",
    label: "Semana 21",
    focus: "Base larga 14K",
    statusLabel: "Plan 21K",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push B", status: "upcoming" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "8 km Z2" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna", status: "upcoming", note: "controlado" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "55 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull A", status: "upcoming" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "14 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s22",
    label: "Semana 22",
    focus: "Construccion 15K",
    statusLabel: "Plan 21K",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push A", status: "upcoming" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "8 km + 4 progresivos" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna", status: "upcoming", note: "moderado" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "55 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull B", status: "upcoming" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "15 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s23",
    label: "Semana 23",
    focus: "Descarga",
    statusLabel: "Plan 21K",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push suave", status: "upcoming", note: "70%" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "6 km Z2" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna descarga", status: "upcoming", note: "movilidad" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "40 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull A", status: "upcoming", note: "suave" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "11 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s24",
    label: "Semana 24",
    focus: "Pico controlado 16K",
    statusLabel: "Plan 21K",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push B", status: "upcoming" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "9 km Z2" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna", status: "upcoming", note: "sin fallo" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "60 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull B", status: "upcoming" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "16 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s25",
    label: "Semana 25",
    focus: "Pico controlado 17K",
    statusLabel: "Plan 21K",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push A", status: "upcoming" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "8 km con 2 km ritmo 21K" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna", status: "upcoming", note: "moderado" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "45-50 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull A", status: "upcoming" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "17 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s26",
    label: "Semana 26",
    focus: "Pico 18K",
    statusLabel: "Plan 21K",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push suave", status: "upcoming", note: "70-80%" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "8 km Z2" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna descarga", status: "upcoming", note: "sin DOMS" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "45 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull B", status: "upcoming", note: "suave" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "18 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s27",
    label: "Semana 27",
    focus: "Taper",
    statusLabel: "Plan 21K",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Push suave", status: "upcoming", note: "50-60%" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "6-7 km Z2" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Pierna descarga", status: "upcoming", note: "movilidad" },
      { dayShort: "Jue", dayName: "Jueves", session: "Cardio Z2", status: "upcoming", note: "35-40 min" },
      { dayShort: "Vie", dayName: "Viernes", session: "Pull A", status: "upcoming", note: "ligero" },
      { dayShort: "Sab", dayName: "Sabado", session: "Tirada Larga", status: "upcoming", note: "12 km facil" },
      { dayShort: "Dom", dayName: "Domingo", session: "Descanso", status: "rest" },
    ],
  },
  {
    id: "s28",
    label: "Semana 28",
    focus: "Semana de carrera 21K",
    statusLabel: "Carrera",
    days: [
      { dayShort: "Lun", dayName: "Lunes", session: "Movilidad", status: "upcoming", note: "20-30 min" },
      { dayShort: "Mar", dayName: "Martes", session: "Carrera", status: "upcoming", note: "5 km Z2" },
      { dayShort: "Mie", dayName: "Miercoles", session: "Movilidad", status: "upcoming", note: "sin carga" },
      { dayShort: "Jue", dayName: "Jueves", session: "Carrera suave", status: "upcoming", note: "4 km + 4 strides" },
      { dayShort: "Vie", dayName: "Viernes", session: "Descanso", status: "rest", note: "dormir bien" },
      { dayShort: "Sab", dayName: "Sabado", session: "Activacion", status: "upcoming", note: "20 min suave" },
      { dayShort: "Dom", dayName: "Domingo", session: "Media Maraton", status: "upcoming", note: "21.1 km" },
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
  "Push suave": [
    { name: "Press principal", series: "3 x 8-10", load: "70-80%", notes: "RPE 6-7, sin fallo" },
    { name: "Press secundario", series: "2-3 x 10", load: "ligero" },
    { name: "Hombro lateral", series: "2 x 12-15", load: "ligero" },
    { name: "Movilidad toracica y hombro", series: "8-10 min", notes: "Salir fresco" },
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
  "Pierna descarga": [
    { name: "Movilidad cadera/tobillo", series: "8-10 min", notes: "Sin dolor" },
    { name: "Goblet squat tecnico", series: "2-3 x 8", load: "ligero" },
    { name: "Puente gluteo", series: "2-3 x 12", notes: "Controlado" },
    { name: "Elevaciones de talon", series: "2 x 12", notes: "Sin excentrico agresivo" },
    { name: "Core antirotacion", series: "2 x 10 por lado", notes: "Salir mejor de lo que entraste" },
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
  "Carrera suave": [
    { name: "Trote suave", series: "1 bloque", notes: "Muy facil, sin fatigar piernas" },
    { name: "Strides", series: "4 x 15-20 s", notes: "Rapidos pero relajados, recuperacion completa" },
  ],
  Movilidad: [
    { name: "Movilidad general", series: "20-30 min", notes: "Cadera, tobillo, espalda y caminata suave" },
    { name: "Liberacion suave", series: "5-8 min", notes: "No buscar dolor" },
  ],
  Activacion: [
    { name: "Trote de activacion", series: "15-20 min", notes: "Muy facil" },
    { name: "Strides", series: "3 x 15 s", notes: "Solo si piernas se sienten bien" },
  ],
  "Media Maraton": [
    { name: "Media maraton", series: "21.1 km", notes: "Salida conservadora; correr por sensacion los primeros 10 km" },
    { name: "Hidratacion y energia", series: "Plan de carrera", notes: "Probar estrategia antes; nada nuevo el dia de carrera" },
  ],
  Descanso: [
    { name: "Descanso activo", series: "Opcional", notes: "Movilidad, caminar y recuperacion" },
  ],
};

export const sessionHistory: SessionHistoryItem[] = [
  ...([...(generatedHistory.sessionHistory as SessionHistoryItem[])].reverse()),
];

export const routineHtmlWeeks = [
  5, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
];
