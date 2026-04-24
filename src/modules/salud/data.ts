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

export const healthSummaryStats: HealthStat[] = [
  { label: "Peso actual", value: "81.2 kg", detail: "27.3% grasa corporal" },
  { label: "Masa muscular", value: "30.7 kg", detail: "BMR: 1861 kcal" },
  {
    label: "Grasa visceral",
    value: "10",
    detail: "Objetivo: 8 o menos",
    tone: "warning",
  },
  {
    label: "Score InBody",
    value: "75 pts",
    detail: "Objetivo: 90+",
    tone: "warning",
  },
];

export const latestMeasurement = {
  title: "Composicion InBody",
  dateLabel: "Ultima medicion: 16 abr 2026",
  bodyFat: "27.3%",
  bodyFatLabel: "Body fat",
};

export const compositionMetrics: CompositionMetric[] = [
  { label: "Masa muscular", value: "30.7 kg", progress: 72 },
  { label: "Grasa visceral", value: "10 niv", progress: 56 },
  { label: "Score InBody", value: "75 pts", progress: 75 },
];

export const weightTrend: TrendPoint[] = [
  { label: "Jul 24", value: 78.3 },
  { label: "Jun 25", value: 75.3 },
  { label: "Nov 25", value: 79.4 },
  { label: "Mar 26", value: 80.3 },
  { label: "Abr 26", value: 81.2 },
];

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
