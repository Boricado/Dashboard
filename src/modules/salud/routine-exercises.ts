// Datos de ejercicios por tipo de sesión y semana
// Cada entrada tiene los ejercicios con pesos progresivos por semana

export type ExercisePlan = {
  letter: string;
  name: string;
  muscle: string;
  sets: string;
  reps: string;
  weightByWeek: Record<string, string>; // week_code -> weight, "base" = default
  badgeMap?: Record<string, "ok" | "warn" | "new">; // week_code -> badge type
  rest: string;
};

export type SessionPlan = {
  title: string;
  focus: string;
  exercises: ExercisePlan[];
  warmup: { icon: string; text: string }[];
  alert: { type: "green" | "orange" | "blue" | "red" | "gold"; text: string };
  note?: string;
  finisher?: string;
};

const defaultWeights = {
  push_a: {
    title: "Press de banca plano · Press inclinado DB · Military press · Deltoides — Bloque de carga",
    focus: "Pecho plano · Hombros · Tríceps",
    alert_text: "Banca plano como movimiento principal. Descansa 3 min entre series pesadas. Técnica sobre peso.",
  },
  push_b: {
    title: "Press inclinado barra · Dips · Press hombro DB · Deltoides — Bloque de carga",
    focus: "Pecho inclinado · Hombros · Tríceps",
    alert_text: "Press inclinado como movimiento principal. Dips: control excéntrico, no rebotes. Técnica sobre peso.",
  },
  pierna: {
    title: "Goblet squat · RDL · Hip thrust · Isquios · Gemelos — Pierna completa",
    focus: "Cuádriceps · Glúteos · Isquiotibiales",
    alert_text: "Protocolo rodilla obligatorio. Goblet squat máx 90° de flexión. Hip thrust: glúteo apretado en la cima.",
  },
  pull_a: {
    title: "Dominadas · T-bar row · Remo DB · Face pulls · Bíceps — Bloque de tracción",
    focus: "Dorsal · Romboides · Bíceps",
    alert_text: "Prioriza dominadas limpias sobre cantidad. T-bar: espalda neutra siempre.",
  },
  pull_b: {
    title: "Jalón al pecho · Remo barra · Pullover · Bíceps — Bloque de tracción vertical y horizontal",
    focus: "Dorsal ancho · Romboides · Bíceps",
    alert_text: "Jalón al pecho: control excéntrico completo. Remo barra: espalda neutra, no arquees lumbar.",
  },
  carrera: {
    title: "Carrera aeróbica",
    focus: "Base aeróbica · Z2",
    alert_text: "",
  },
  tirada: {
    title: "Tirada larga",
    focus: "Resistencia aeróbica · Z2",
    alert_text: "",
  },
  descanso: {
    title: "Descanso",
    focus: "Recuperación activa",
    alert_text: "",
  },
};

// Helpers to get weight for a week
function w(main: string, ...overrides: [string, string][]): Record<string, string> {
  const base: Record<string, string> = { base: main };
  for (const [week, weight] of overrides) {
    base[week] = weight;
  }
  return base;
}

// --- PUSH A ---
export const pushAExercises: ExercisePlan[] = [
  {
    letter: "A", name: "Press de banca plano", muscle: "Pectoral mayor · Deltoides anterior · Tríceps",
    sets: "4", reps: "8–12",
    weightByWeek: w("57.5 kg", ["s22", "57.5 kg"], ["s24", "60 kg"], ["s25", "57.5 kg"], ["s26", "57.5 kg"]),
    rest: "3 min",
  },
  {
    letter: "B", name: "Press inclinado mancuerna (DB)", muscle: "Pectoral superior · Deltoides anterior",
    sets: "3", reps: "10–12",
    weightByWeek: w("25 kg", ["s22", "25 kg"], ["s24", "25 kg"], ["s25", "25 kg"], ["s26", "25 kg"]),
    rest: "2:30 min",
  },
  {
    letter: "C", name: "Military press (barra o DB)", muscle: "Deltoides frontal/medio · Tríceps · Trapecio",
    sets: "4", reps: "8–10",
    weightByWeek: w("35 kg", ["s22", "35 kg"], ["s24", "37.5 kg"], ["s25", "35 kg"], ["s26", "35 kg"]),
    rest: "3 min",
  },
  {
    letter: "D", name: "Elevaciones laterales de pie", muscle: "Deltoides medio — aislamiento",
    sets: "4", reps: "12–15",
    weightByWeek: w("10 kg"),
    rest: "1:30 min",
  },
  {
    letter: "E", name: "Aperturas con mancuerna", muscle: "Pectoral mayor — estiramiento completo",
    sets: "3", reps: "12–15",
    weightByWeek: w("17.5 kg", ["s22", "17.5 kg"], ["s24", "20 kg"], ["s25", "17.5 kg"], ["s26", "17.5 kg"]),
    rest: "1:30 min",
  },
  {
    letter: "F", name: "Plancha", muscle: "Core — abdomen profundo · Estabilización lumbo-pélvica",
    sets: "3", reps: "30–45 s", weightByWeek: w("BW"), rest: "1 min",
  },
  {
    letter: "G", name: "Russian twists con mancuerna", muscle: "Oblicuos · Transverso del abdomen",
    sets: "3", reps: "12–15 c/u", weightByWeek: w("10 kg"), rest: "1 min",
  },
  {
    letter: "H", name: "L-sit", muscle: "Core · Flexores de cadera · Tríceps — estabilización completa",
    sets: "3", reps: "10–15 s", weightByWeek: w("BW"), rest: "1 min",
  },
];

export const pushBExercises: ExercisePlan[] = [
  {
    letter: "A", name: "Press inclinado barra (30–45°)", muscle: "Pectoral superior · Deltoides anterior",
    sets: "4", reps: "8–12",
    weightByWeek: w("47.5 kg", ["s21", "47.5 kg"], ["s23", "50 kg"], ["s25", "47.5 kg"], ["s27", "47.5 kg"]),
    badgeMap: { base: "ok" }, rest: "3 min",
  },
  {
    letter: "B", name: "Dips en paralelas", muscle: "Pectoral inferior · Tríceps · Deltoides anterior",
    sets: "3", reps: "8–12",
    weightByWeek: w("BW"),
    rest: "2:30 min",
  },
  {
    letter: "C", name: "Press hombro sentado DB", muscle: "Deltoides frontal/medio · Tríceps",
    sets: "3", reps: "10–12",
    weightByWeek: w("17.5 kg", ["s21", "17.5 kg"], ["s23", "20 kg"], ["s25", "17.5 kg"], ["s27", "17.5 kg"]),
    rest: "2 min",
  },
  {
    letter: "D", name: "Elevaciones laterales sentado", muscle: "Deltoides medio — sentado, más aislamiento",
    sets: "4", reps: "15",
    weightByWeek: w("10 kg"),
    rest: "1:30 min",
  },
  {
    letter: "E", name: "Skullcrusher EZ + Press agarre cerrado (superset)", muscle: "Tríceps largo + medial — 10 skulls directo a 10 press",
    sets: "3", reps: "10+10",
    weightByWeek: w("25 lb c/lado"),
    rest: "2 min",
  },
  {
    letter: "F", name: "Plancha", muscle: "Core — abdomen profundo · Estabilización lumbo-pélvica",
    sets: "3", reps: "30–45 s", weightByWeek: w("BW"), rest: "1 min",
  },
  {
    letter: "G", name: "Russian twists con mancuerna", muscle: "Oblicuos · Transverso del abdomen",
    sets: "3", reps: "12–15 c/u", weightByWeek: w("10 kg"), rest: "1 min",
  },
  {
    letter: "H", name: "L-sit", muscle: "Core · Flexores de cadera · Tríceps — estabilización completa",
    sets: "3", reps: "10–15 s", weightByWeek: w("BW"), rest: "1 min",
  },
];

export const piernaExercises: ExercisePlan[] = [
  {
    letter: "A", name: "Goblet squat con mancuerna", muscle: "Cuádriceps · Glúteos — máx 90° de flexión de rodilla",
    sets: "4", reps: "10–12",
    weightByWeek: w("25 kg", ["s22", "25 kg"], ["s25", "25 kg"], ["s26", "25 kg"]),
    rest: "2:30 min",
  },
  {
    letter: "B", name: "Romanian Deadlift con mancuernas", muscle: "Isquiotibiales · Glúteos · Erectors",
    sets: "4", reps: "10–12",
    weightByWeek: w("25 kg", ["s22", "25 kg"], ["s25", "25 kg"], ["s26", "25 kg"]),
    rest: "2:30 min",
  },
  {
    letter: "C", name: "Hip thrust con barra", muscle: "Glúteo mayor — motor principal de la carrera",
    sets: "4", reps: "12–15",
    weightByWeek: w("55 lb/lado + barra 20 kg", ["s22", "55 lb/lado"], ["s25", "55 lb/lado"], ["s26", "55 lb/lado"]),
    rest: "2:30 min",
  },
  {
    letter: "D", name: "Curl isquio en máquina", muscle: "Isquiotibiales — aislamiento",
    sets: "3", reps: "12–15",
    weightByWeek: w("60 lb"),
    rest: "1:30 min",
  },
  {
    letter: "E", name: "Elevaciones de talón excéntricas (escalón)", muscle: "Sóleo · Gastrocnemio — clave running y rodilla",
    sets: "4", reps: "15 c/u",
    weightByWeek: w("Corporal"),
    rest: "1 min",
  },
  {
    letter: "G", name: "Abductor en máquina", muscle: "Glúteo medio · Estabilización rodilla",
    sets: "3", reps: "15–20",
    weightByWeek: w("Máquina"),
    rest: "1 min",
  },
  {
    letter: "H", name: "Aductor en máquina", muscle: "Aductores · Equilibrio muscular cara interna",
    sets: "2", reps: "15–20",
    weightByWeek: w("82 lb"),
    rest: "1 min",
  },
];

// --- PULL A ---
export const pullAExercises: ExercisePlan[] = [
  {
    letter: "A", name: "Dominadas sin banda", muscle: "Dorsal ancho · Teres mayor — objetivo reps limpias",
    sets: "4", reps: "7+",
    weightByWeek: w("Peso corporal"),
    rest: "2:30 min",
  },
  {
    letter: "B", name: "T-bar row", muscle: "Dorsal · Romboides · Trapecio medio",
    sets: "4", reps: "8–10",
    weightByWeek: w("45 kg / 100 Lb", ["s21", "45 kg"], ["s23", "47.5 kg"], ["s25", "45 kg"], ["s27", "45 kg"]),
    rest: "2:30 min",
  },
  {
    letter: "C", name: "Remo unilateral con mancuerna", muscle: "Dorsal · Control unilateral · Romboides",
    sets: "3", reps: "10–12",
    weightByWeek: w("35 kg", ["s21", "35 kg"], ["s23", "36 kg"], ["s25", "35 kg"], ["s27", "35 kg"]),
    rest: "2 min",
  },
  {
    letter: "D", name: "Face pulls (polea o banda)", muscle: "Deltoides posterior · Manguito rotador · Postura",
    sets: "4", reps: "15–20",
    weightByWeek: w("30 kg"),
    rest: "1:30 min",
  },
  {
    letter: "E", name: "Curl EZ en banco predicador", muscle: "Bíceps braquial — técnica aislada sin balanceo",
    sets: "3", reps: "10–12",
    weightByWeek: w("25 kg"),
    rest: "1:30 min",
  },
  {
    letter: "F", name: "Curl martillo con mancuernas", muscle: "Braquialis · Grosor del brazo",
    sets: "3", reps: "10–12",
    weightByWeek: w("18 kg"),
    rest: "1:30 min",
  },
  {
    letter: "G", name: "Dead bug", muscle: "Core — lumbares · Transverso · Estabilización lumbo-pélvica",
    sets: "3", reps: "10–12 c/u", weightByWeek: w("BW"), rest: "1 min",
  },
  {
    letter: "H", name: "Pallof press (polea)", muscle: "Oblicuos · Resistencia rotacional — core anti-rotación",
    sets: "3", reps: "12–15 c/u", weightByWeek: w("15 kg"), rest: "1 min",
  },
];

export const pullBExercises: ExercisePlan[] = [
  {
    letter: "A", name: "Jalón al pecho polea agarre ancho", muscle: "Dorsal ancho · Teres mayor — agarre más ancho que hombros",
    sets: "4", reps: "10–12",
    weightByWeek: w("45 kg", ["s22", "45 kg"], ["s24", "47.5 kg"], ["s25", "45 kg"], ["s26", "45 kg"]),
    rest: "2:30 min",
  },
  {
    letter: "B", name: "Remo con barra agarre prono", muscle: "Dorsal · Romboides · Trapecio — espalda neutra siempre",
    sets: "4", reps: "8–10",
    weightByWeek: w("45 kg", ["s22", "45 kg"], ["s24", "47.5 kg"], ["s25", "45 kg"], ["s26", "45 kg"]),
    rest: "2:30 min",
  },
  {
    letter: "C", name: "Pullover con mancuerna", muscle: "Dorsal · Serrato anterior — estiramiento completo de lats",
    sets: "3", reps: "12–15",
    weightByWeek: w("24 kg"),
    rest: "1:30 min",
  },
  {
    letter: "D", name: "Curl EZ barra de pie", muscle: "Bíceps braquial · Braquialis — sin balanceo",
    sets: "3", reps: "10–12",
    weightByWeek: w("27.5 kg"),
    rest: "1:30 min",
  },
  {
    letter: "E", name: "Curl inclinado con mancuerna", muscle: "Bíceps — inclinado estira el músculo completo",
    sets: "3", reps: "12 c/u",
    weightByWeek: w("12.5 kg", ["s24", "14 kg"], ["s25", "12.5 kg"], ["s26", "12.5 kg"]),
    rest: "1:30 min",
  },
  {
    letter: "F", name: "Dead bug", muscle: "Core — lumbares · Transverso · Estabilización lumbo-pélvica",
    sets: "3", reps: "10–12 c/u", weightByWeek: w("BW"), rest: "1 min",
  },
  {
    letter: "G", name: "Pallof press (polea)", muscle: "Oblicuos · Resistencia rotacional — core anti-rotación",
    sets: "3", reps: "12–15 c/u", weightByWeek: w("15 kg"), rest: "1 min",
  },
];

// WARMUPS
export const warmups: Record<string, { icon: string; text: string }[]> = {
  push: [
    { icon: "🔄", text: "<strong>Rotación de hombros</strong>2×15 adelante y atrás" },
    { icon: "💪", text: "<strong>Press barra vacía</strong>2×15, activar pectoral" },
    { icon: "🎯", text: "<strong>Band pull-apart</strong>2×20, banda ligera" },
    { icon: "⭕", text: "<strong>Rotación manguito</strong>2×15 c/u con banda" },
  ],
  pierna: [
    { icon: "🚶", text: "<strong>Caminata en el lugar</strong>2 min movilizando caderas" },
    { icon: "🏋️", text: "<strong>Sentadilla profunda</strong>2×10, pausa 2s abajo" },
    { icon: "🦵", text: "<strong>Estocada caminando</strong>2×10 c/u, activar glúteo" },
    { icon: "🔓", text: "<strong>Rodilla al pecho + talón al glúteo</strong>2×10 c/u dinámicos" },
  ],
  pull: [
    { icon: "🔄", text: "<strong>Rotación escapular</strong>2×15, preparar manguito" },
    { icon: "🎯", text: "<strong>Band pull-apart</strong>2×20, banda ligera" },
    { icon: "💪", text: "<strong>Estiramiento dorsal en polea</strong>2×15, activar lats" },
    { icon: "⭕", text: "<strong>Rotación manguito</strong>2×15 c/u con banda" },
  ],
  cardio: [
    { icon: "🏃", text: "<strong>Caminata rápida</strong>3 min, empezar a sudar" },
    { icon: "🦵", text: "<strong>Talones al glúteo</strong>2×20 c/u dinámicos" },
    { icon: "📐", text: "<strong>Rodillas arriba</strong>2×20 c/u, suaves" },
    { icon: "🎯", text: "<strong>Ejercicios de activación</strong> skipping, círculos cadera" },
  ],
};

// HELPERS
export function getExerciseWeight(ex: ExercisePlan, weekCode: string): string {
  return ex.weightByWeek[weekCode] || ex.weightByWeek.base || "";
}

export function getExerciseBadge(ex: ExercisePlan, weekCode: string): { type: string; label: string } {
  if (ex.badgeMap?.[weekCode]) {
    const b = ex.badgeMap[weekCode];
    const labels: Record<string, string> = { ok: "PROGRESIÓN", warn: "MANTÉN", new: "NUEVO" };
    return { type: b, label: labels[b] };
  }
  if (!ex.weightByWeek.base) return { type: "warn", label: "MANTÉN" };
  const base = parseWeight(ex.weightByWeek.base);
  const current = parseWeight(getExerciseWeight(ex, weekCode));
  if (current === null || base === null) return { type: "warn", label: "MANTÉN" };
  if (current > base) return { type: "ok", label: "PROGRESIÓN" };
  if (current < base) return { type: "new", label: "REGRESIÓN" };
  return { type: "warn", label: "MANTÉN" };
}

function parseWeight(w: string): number | null {
  const m = w.match(/^([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

export function getSessionExercises(sessionName: string): ExercisePlan[] | null {
  const s = sessionName.toLowerCase();
  if (s.includes("push a")) return pushAExercises;
  if (s.includes("push b")) return pushBExercises;
  if (s.includes("pierna")) return piernaExercises;
  if (s.includes("pull a")) return pullAExercises;
  if (s.includes("pull b")) return pullBExercises;
  return null;
}

export function getSessionInfo(sessionName: string, weekCode: string) {
  const s = sessionName.toLowerCase();
  const exercises = getSessionExercises(sessionName);
  let warmupType = "push";
  if (s.includes("pierna")) warmupType = "pierna";
  else if (s.includes("pull")) warmupType = "pull";
  else if (s.includes("carrera") || s.includes("tirada")) warmupType = "cardio";

  let title = "";
  let focus = "";
  let alertText = "Sesión del plan semanal. Prioriza técnica sobre peso.";

  if (s.includes("push a")) {
    title = defaultWeights.push_a.title;
    focus = defaultWeights.push_a.focus;
    alertText = defaultWeights.push_a.alert_text;
  } else if (s.includes("push b")) {
    title = defaultWeights.push_b.title;
    focus = defaultWeights.push_b.focus;
    alertText = defaultWeights.push_b.alert_text;
  } else if (s.includes("pierna")) {
    title = defaultWeights.pierna.title;
    focus = defaultWeights.pierna.focus;
    alertText = defaultWeights.pierna.alert_text;
  } else if (s.includes("pull a")) {
    title = defaultWeights.pull_a.title;
    focus = defaultWeights.pull_a.focus;
    alertText = defaultWeights.pull_a.alert_text;
  } else if (s.includes("pull b")) {
    title = defaultWeights.pull_b.title;
    focus = defaultWeights.pull_b.focus;
    alertText = defaultWeights.pull_b.alert_text;
  } else if (s.includes("carrera")) {
    title = defaultWeights.carrera.title;
    focus = defaultWeights.carrera.focus;
  } else if (s.includes("tirada")) {
    title = defaultWeights.tirada.title;
    focus = defaultWeights.tirada.focus;
  } else if (s.includes("descanso")) {
    title = defaultWeights.descanso.title;
    focus = defaultWeights.descanso.focus;
  }

  return { exercises, warmupType, title, focus, alertText };
}
