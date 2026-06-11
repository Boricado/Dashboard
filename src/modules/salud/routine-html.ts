// Generador de HTML de rutinas semanales desde datos de Supabase
import { getSessionInfo, getExerciseWeight, getExerciseBadge, warmups } from "./routine-exercises";

type WeekData = {
  id: string;
  week_code: string;
  label: string;
  focus: string;
  status_label: string;
  sort_order: number;
};

type DayData = {
  id: string;
  week_id: string;
  day_index: number;
  day_short: string;
  day_name: string;
  session_name: string;
  status: "completed" | "today" | "upcoming" | "rest";
  note: string | null;
};

// Datos de DB parseados desde la columna note
export type DbExercise = {
  letter: string;
  name: string;
  muscle: string;
  sets: string;
  reps: string;
  load: string;
  loadPrev: string | null;
  badge: string | null;
  rest: string;
};

export type DayDbMeta = {
  focus: string | null;
  alertType: string | null;
  alertText: string | null;
  warmups: { icon: string; text: string }[] | null;
  cardio: { distance: string | null; zone: string | null; pace: string | null; zoneNote: string | null } | null;
};

export type DayDbData = {
  exercises: DbExercise[];
  meta: DayDbMeta | null;
};

const dayIndexMap = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
const dayNameMap = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const sessionColors: Record<string, string> = {
  push: "dot-push",
  pull: "dot-pull",
  pierna: "dot-legs",
  carrera: "dot-cardio",
  tirada: "dot-sport",
  descanso: "dot-rest",
};

function sessionColor(session: string): string {
  const s = session.toLowerCase();
  if (s.includes("push")) return sessionColors.push;
  if (s.includes("pull")) return sessionColors.pull;
  if (s.includes("pierna")) return sessionColors.pierna;
  if (s.includes("carrera")) return sessionColors.carrera;
  if (s.includes("tirada")) return sessionColors.tirada;
  return sessionColors.descanso;
}

function sessionAbbrev(session: string): string {
  const s = session.toLowerCase();
  if (s.includes("push a")) return "Push A";
  if (s.includes("push b")) return "Push B";
  if (s.includes("pull a")) return "Pull A";
  if (s.includes("pull b")) return "Pull B";
  if (s.includes("pierna")) return "Pierna";
  if (s.includes("carrera")) return "Carrera";
  if (s.includes("tirada")) return "Tirada";
  return session;
}

function sessionTypeAbbrev(session: string): string {
  const s = session.toLowerCase();
  if (s.includes("push")) return "Pecho · Hombros · Tríceps";
  if (s.includes("pull")) return "Dorsal · Romboides · Bíceps";
  if (s.includes("pierna")) return "Cuádriceps · Glúteos · Isquios";
  if (s.includes("carrera") || s.includes("tirada")) return "Z2 · Aeróbico base";
  return "Recuperación activa";
}

// CSS inline completo (copiado del archivo estático)
const STYLES = `
:root {
  --bg: #0f0f0f;
  --surface: #1a1a1a;
  --surface2: #242424;
  --border: rgba(255,255,255,0.07);
  --text: #f0f0f0;
  --text2: #888;
  --text3: #555;
  --green: #22c55e;
  --green-dim: rgba(34,197,94,0.12);
  --orange: #f97316;
  --orange-dim: rgba(249,115,22,0.12);
  --red: #ef4444;
  --red-dim: rgba(239,68,68,0.12);
  --blue: #3b82f6;
  --blue-dim: rgba(59,130,246,0.12);
  --gold: #eab308;
  --gold-dim: rgba(234,179,8,0.12);
  --mono: 'Space Mono', monospace;
  --sans: 'DM Sans', sans-serif;
}
* { margin:0; padding:0; box-sizing:border-box; }
body { background:var(--bg); color:var(--text); font-family:var(--sans); font-size:14px; line-height:1.5; min-height:100vh; }
.header { padding:48px 48px 32px; border-bottom:1px solid var(--border); display:grid; grid-template-columns:1fr auto; gap:32px; align-items:end; }
.header-eyebrow { font-family:var(--mono); font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:var(--orange); margin-bottom:12px; }
.header-title { font-size:42px; font-weight:300; letter-spacing:-0.03em; line-height:1; margin-bottom:8px; }
.header-title strong { font-weight:600; color:var(--orange); }
.header-sub { font-size:13px; color:var(--text2); max-width:520px; }
.header-stats { display:flex; gap:2px; }
.hs { background:var(--surface); border:1px solid var(--border); padding:16px 20px; display:flex; flex-direction:column; gap:4px; min-width:90px; }
.hs-label { font-family:var(--mono); font-size:8px; letter-spacing:0.15em; text-transform:uppercase; color:var(--text3); }
.hs-value { font-family:var(--mono); font-size:20px; font-weight:700; line-height:1; }
.hs-value.g { color:var(--green); }
.hs-value.o { color:var(--orange); }
.hs-value.b { color:var(--blue); }
.hs-value.gold { color:var(--gold); }
.hs-value.r { color:var(--red); }
.week-strip { display:grid; grid-template-columns:repeat(7,1fr); border-bottom:1px solid var(--border); }
.ws-day { padding:16px 12px; border-right:1px solid var(--border); cursor:pointer; transition:background 0.15s; position:relative; }
.ws-day:last-child { border-right:none; }
.ws-day:hover { background:var(--surface); }
.ws-day.active { background:var(--surface2); }
.ws-day.active::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:var(--orange); }
.wsd-num { font-family:var(--mono); font-size:9px; letter-spacing:0.15em; color:var(--text3); margin-bottom:4px; text-transform:uppercase; }
.wsd-name { font-size:12px; font-weight:600; margin-bottom:2px; }
.wsd-type { font-size:11px; color:var(--text2); }
.wsd-dot { width:6px; height:6px; border-radius:50%; margin-top:8px; }
.dot-push { background:var(--orange); }
.dot-pull { background:var(--blue); }
.dot-legs { background:var(--green); }
.dot-cardio { background:var(--red); }
.dot-sport { background:var(--gold); }
.dot-rest { background:var(--text3); }
.panel { display:none; padding:40px 48px; }
.panel.active { display:block; }
.day-title-row { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:32px; gap:24px; flex-wrap:wrap; }
.day-title { font-size:28px; font-weight:600; letter-spacing:-0.02em; margin-bottom:4px; }
.day-focus { font-size:13px; color:var(--text2); }
.alert { padding:14px 18px; border-radius:0; font-size:13px; line-height:1.6; margin-bottom:24px; border-left:3px solid; display:flex; gap:12px; align-items:flex-start; }
.alert.green { background:var(--green-dim); border-color:var(--green); color:var(--green); }
.alert.orange { background:var(--orange-dim); border-color:var(--orange); color:var(--orange); }
.alert.red { background:var(--red-dim); border-color:var(--red); color:var(--red); }
.alert.gold { background:var(--gold-dim); border-color:var(--gold); color:var(--gold); }
.alert.blue { background:var(--blue-dim); border-color:var(--blue); color:var(--blue); }
.alert-text { color:var(--text); }
.alert-text strong { color:inherit; }
.ex-table { width:100%; border-collapse:collapse; margin-bottom:8px; }
.ex-table thead th { font-family:var(--mono); font-size:8px; letter-spacing:0.15em; text-transform:uppercase; color:var(--text3); padding:10px 16px; text-align:left; border-bottom:1px solid var(--border); font-weight:400; background:var(--surface); }
.ex-table thead th.r { text-align:right; }
.ex-table thead th.c { text-align:center; }
.ex-table tbody tr { border-bottom:1px solid var(--border); transition:background 0.1s; }
.ex-table tbody tr:last-child { border-bottom:none; }
.ex-table tbody tr:hover { background:var(--surface); }
.ex-table td { padding:14px 16px; vertical-align:middle; }
.td-letter { font-family:var(--mono); font-size:11px; font-weight:700; color:var(--text3); width:32px; }
.td-name { font-size:14px; font-weight:500; }
.td-muscle { font-size:11px; color:var(--text2); margin-top:2px; }
.td-sets { font-family:var(--mono); font-size:13px; font-weight:700; text-align:center; color:var(--orange); }
.td-reps { font-family:var(--mono); font-size:12px; text-align:center; color:var(--text2); }
.td-weight { text-align:right; }
.w-badge { display:inline-flex; align-items:center; gap:6px; font-family:var(--mono); font-size:13px; font-weight:700; padding:4px 10px; }
.w-badge.same { color:var(--text); background:var(--surface2); }
.w-badge.up { color:var(--green); background:var(--green-dim); }
.w-badge.down { color:var(--red); background:var(--red-dim); }
.w-badge.new { color:var(--blue); background:var(--blue-dim); }
.w-arrow { font-size:10px; }
.td-prev { font-family:var(--mono); font-size:11px; color:var(--text3); text-align:right; text-decoration:line-through; }
.td-status { text-align:center; }
.status-badge { font-family:var(--mono); font-size:9px; letter-spacing:0.1em; text-transform:uppercase; padding:3px 8px; }
.status-badge.ok { background:var(--green-dim); color:var(--green); }
.status-badge.warn { background:var(--orange-dim); color:var(--orange); }
.status-badge.fail { background:var(--red-dim); color:var(--red); }
.status-badge.new { background:var(--blue-dim); color:var(--blue); }
.ex-note { font-size:12px; color:var(--text2); padding:8px 16px; background:var(--surface); border-left:2px solid var(--orange); margin-bottom:24px; line-height:1.6; }
.ex-note strong { color:var(--orange); }
.section-title { font-family:var(--mono); font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:var(--text3); margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--border); }
.warmup-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:2px; margin-bottom:32px; }
.warmup-item { background:var(--surface); padding:14px 16px; display:flex; align-items:center; gap:10px; }
.wi-icon { font-size:16px; }
.wi-text { font-size:12px; color:var(--text2); }
.wi-text strong { color:var(--text); font-size:13px; display:block; margin-bottom:1px; }
.progress-section { margin-top:40px; padding-top:32px; border-top:1px solid var(--border); }
.plan-table { width:100%; border-collapse:collapse; margin-top:16px; }
.plan-table thead th { font-family:var(--mono); font-size:8px; letter-spacing:0.15em; text-transform:uppercase; color:var(--text3); padding:10px 16px; text-align:left; border-bottom:1px solid var(--border); font-weight:400; background:var(--surface); }
.plan-table tbody tr { border-bottom:1px solid var(--border); transition:background 0.1s; }
.plan-table tbody tr:last-child { border-bottom:none; }
.plan-table tbody tr:hover { background:var(--surface); }
.plan-table tbody tr.current-week { background:var(--orange-dim); }
.plan-table td { padding:12px 16px; vertical-align:middle; font-size:13px; }
.plan-table td.week-num { font-family:var(--mono); font-size:11px; font-weight:700; color:var(--text3); width:80px; }
.plan-table td.current-week-num { font-family:var(--mono); font-size:11px; font-weight:700; color:var(--orange); width:80px; }
@media (max-width:900px) {
  .header { grid-template-columns:1fr; padding:28px 20px 20px; }
  .header-stats { display:none; }
  .week-strip { grid-template-columns:repeat(4,1fr); }
  .panel { padding:24px 20px; }
  .day-title-row { flex-direction:column; }
}
`;

export function generateWeekHtml(
  week: WeekData,
  days: DayData[],
  allWeeks: WeekData[],
  dbDataByDay: Record<string, DayDbData> = {},
): string {
  const weekNum = week.week_code.replace("s", "");
  const raceWeeks = ["s25", "s26", "s27", "s28"];

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rutina Fidel · ${week.label}</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>${STYLES}</style>
</head>
<body>

<div class="header">
  <div>
    <div class="header-eyebrow">PPL + Running · ${week.label} · ${week.focus}</div>
    <div class="header-title">${week.week_code.toUpperCase()} —<br><strong>${week.focus || week.status_label}</strong></div>
    <div class="header-sub">${week.status_label} — ${days.map(d => d.session_name).join(" + ")}. Tirada larga el sábado.</div>
  </div>
  <div class="header-stats">
    <div class="hs"><div class="hs-label">Semana</div><div class="hs-value o">${weekNum}</div></div>
    <div class="hs"><div class="hs-label">Para la carrera</div><div class="hs-value gold">${Math.max(0, 16 - parseInt(weekNum))} sem</div></div>
    <div class="hs"><div class="hs-label">Tirada</div><div class="hs-value g">${getTiradaDistance(days)}</div></div>
    <div class="hs"><div class="hs-label">Objetivo</div><div class="hs-value b">sub-2h</div></div>
  </div>
</div>

<div class="week-strip">
${days.map((day, i) => `
  <div class="ws-day${i === 0 ? ' active' : ''}" onclick="go('${dayIndexMap[day.day_index]}')">
    <div class="wsd-num">${day.day_short} ${getDayDate(day.day_index, weekNum)}</div>
    <div class="wsd-name">${day.session_name}</div>
    <div class="wsd-type">${sessionTypeAbbrev(day.session_name)}</div>
    <div class="wsd-dot ${sessionColor(day.session_name)}"></div>
  </div>`).join("")}
</div>

${days.map((day, i) => renderDayPanel(day, i === 0, week.week_code, dbDataByDay[day.id])).join("")}

<div class="progress-section" style="padding:40px 48px;">
  <div class="section-title">Plan general · hacia La Serena 16/8</div>
  <table class="plan-table">
    <thead><tr>
      <th>Semana</th><th>Bloque</th><th>Tirada</th><th>Objetivo</th><th>Estado</th>
    </tr></thead>
    <tbody>
${allWeeks.map(w => renderPlanRow(w, week.week_code)).join("")}
    </tbody>
  </table>
</div>

<script>
function go(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.ws-day').forEach(d => d.classList.remove('active'));
  document.getElementById('p-' + id).classList.add('active');
  document.querySelectorAll('.ws-day').forEach((d, i) => {
    if (['lun','mar','mie','jue','vie','sab','dom'][i] === id) d.classList.add('active');
  });
}
</script>
</body>
</html>`;
}

function getDayDate(dayIndex: number, weekNum: string): string {
  // Base dates for S19 (9-jun)
  const baseDates: Record<string, string> = {
    "19": "9/6",
    "20": "16/6",
    "21": "23/6",
    "22": "30/6",
    "23": "7/7",
    "24": "14/7",
    "25": "21/7",
    "26": "28/7",
    "27": "4/8",
    "28": "11/8",
  };
  const baseDateStr = baseDates[weekNum] || "9/6";
  const [dayStr, monthStr] = baseDateStr.split("/");
  const baseDay = parseInt(dayStr);
  const baseMonth = parseInt(monthStr);
  const baseDate = new Date(2026, baseMonth - 1, baseDay);
  const targetDate = new Date(baseDate);
  targetDate.setDate(baseDate.getDate() + dayIndex);
  return `${targetDate.getDate()}/${targetDate.getMonth() + 1}`;
}

function getTiradaDistance(days: DayData[]): string {
  const tirada = days.find(d => d.session_name.toLowerCase().includes("tirada"));
  if (tirada?.note) {
    const m = tirada.note.match(/(\d[\d–-]*)\s*km/i);
    if (m) return m[1] + " km";
  }
  return "—";
}

function getWeekTirada(week: WeekData, allDays: DayData[]): string {
  const weekDays = allDays.filter(d => d.week_id === week.id);
  const tirada = weekDays.find(d => d.session_name.toLowerCase().includes("tirada"));
  if (tirada?.note) {
    const m = tirada.note.match(/(\d[\d–-]*)\s*km/i);
    if (m) return m[1] + " km";
  }
  // Fallback by week
  const distMap: Record<string, string> = {
    s11: "12 km", s12: "8 km", s13: "12 km", s14: "13 km",
    s15: "14 km", s16: "10 km", s17: "15 km", s18: "10 km",
    s19: "10-11 km", s20: "14 km", s21: "16 km", s22: "11 km",
    s23: "17 km", s24: "18-19 km", s25: "12 km", s26: "10 km",
    s27: "8 km", s28: "21.1 km",
  };
  return distMap[week.week_code] || "—";
}

function renderPlanRow(week: WeekData, currentWeekCode: string): string {
  const isCurrent = week.week_code === currentWeekCode;
  const isPast = !isCurrent && parseInt(week.week_code.replace("s", "")) < parseInt(currentWeekCode.replace("s", ""));
  const isFuture = !isCurrent && !isPast;
  const weekNum = week.week_code.toUpperCase();

  let blockDisplay = week.focus || week.status_label;
  let statusHtml: string;
  let numClass = isCurrent ? "current-week-num" : "week-num";
  let rowClass = isCurrent ? ' class="current-week"' : "";

  const isRaceWeek = ["s25", "s26", "s27"].includes(week.week_code);
  const isRaceDay = week.week_code === "s28";

  if (isRaceDay) {
    statusHtml = `<span class="status-badge" style="background:var(--gold-dim); color:var(--gold);">RACE DAY</span>`;
    return `<tr${rowClass}>
      <td class="${numClass}">${weekNum}</td>
      <td style="font-size:12px; color:var(--gold); font-weight:600;">${blockDisplay}</td>
      <td style="font-family:var(--mono); font-size:13px; font-weight:700; color:var(--gold);">${getWeekTirada(week, [])}</td>
      <td style="font-size:12px; color:var(--text2);">Media Maratón La Serena. Sub-2h (5:41/km).</td>
      <td>${statusHtml}</td>
    </tr>`;
  }

  if (isRaceWeek) {
    return `<tr${rowClass}>
      <td class="${numClass}">${weekNum}</td>
      <td style="font-size:12px; color:var(--text3);">${blockDisplay}</td>
      <td style="font-family:var(--mono); font-size:13px; color:var(--text3);">${getWeekTirada(week, [])}</td>
      <td style="font-size:12px; color:var(--text3);">Taper</td>
      <td style="font-family:var(--mono); font-size:9px; color:var(--text3);">Taper</td>
    </tr>`;
  }

  if (isCurrent) {
    statusHtml = '<span class="status-badge ok">ESTA SEMANA</span>';
  } else if (isPast) {
    statusHtml = '<span class="status-badge ok">Completada</span>';
  } else {
    statusHtml = '<span style="font-family:var(--mono); font-size:9px; color:var(--text3);">Futura</span>';
  }

  const styleColor = isCurrent ? "var(--orange)" : (isPast ? "var(--text)" : "var(--text3)");
  const roundedFocus = blockDisplay.length > 25 ? blockDisplay.substring(0, 25) + "…" : blockDisplay;

  return `<tr${rowClass}>
    <td class="${numClass}">${isCurrent ? `${weekNum} ← HOY` : weekNum}</td>
    <td style="font-size:12px; color:${styleColor}; font-weight:${isCurrent ? 600 : 400};">${roundedFocus}</td>
    <td style="font-family:var(--mono); font-size:13px; font-weight:${isCurrent ? 700 : 400}; color:${isCurrent ? "var(--orange)" : "var(--text)"};">${getWeekTirada(week, [])}</td>
    <td style="font-size:12px; color:var(--text2);">${week.status_label}</td>
    <td>${statusHtml}</td>
  </tr>`;
}

function renderDayPanel(day: DayData, isActive: boolean, weekCode: string, dbData?: DayDbData): string {
  const dayId = dayIndexMap[day.day_index];
  const isRest = day.session_name.toLowerCase().includes("descanso");
  const isCardio = day.session_name.toLowerCase().includes("carrera") || day.session_name.toLowerCase().includes("tirada");

  const dbFocus = dbData?.meta?.focus ? escapeHtml(dbData.meta.focus) : null;
  const focusText = dbFocus || sessionTypeAbbrev(day.session_name);

  let content = "";

  if (isRest) {
    const restNote = dbData?.meta?.alertText || day.note || "Recuperación activa — caminar, estiramientos suaves, yoga si toca.";
    content = `
  <div class="alert green"><span>✅</span><span class="alert-text"><strong>Descanso programado.</strong> ${escapeHtml(restNote)}</span></div>`;
  } else if (isCardio) {
    content = renderCardioPanel(day, weekCode, dbData);
  } else {
    content = renderGymPanel(day, weekCode, dbData);
  }

  return `
<div id="p-${dayId}" class="panel${isActive ? ' active' : ''}">
  <div class="day-title-row">
    <div>
      <div class="day-title">${day.session_name} · ${day.day_name}</div>
      <div class="day-focus">${focusText}</div>
    </div>
  </div>
  ${content}
</div>`;
}

function renderGymPanel(day: DayData, weekCode: string, dbData?: DayDbData): string {
  // Use DB data if available
  const dbExercises = dbData?.exercises;
  const dbMeta = dbData?.meta;

  const info = getSessionInfo(day.session_name, weekCode);
  const wType = info.warmupType as "push" | "pull" | "pierna" | "cardio";

  // Determine warmup items: DB first, then fall back to hardcoded
  const warmupItems = dbMeta?.warmups && dbMeta.warmups.length > 0
    ? dbMeta.warmups
    : (warmups[wType] || warmups.push);

  // Alert: DB meta first, then hardcoded
  let alertHtml = "";
  if (dbMeta?.alertType && dbMeta?.alertText) {
    const alertType = dbMeta.alertType;
    alertHtml = `<div class="alert ${escapeHtml(alertType)}"><span>⚠️</span><span class="alert-text"><strong>${escapeHtml(dbMeta.alertText)}</strong></span></div>`;
  } else if (dbMeta?.alertText) {
    alertHtml = `<div class="alert orange"><span>⚠️</span><span class="alert-text"><strong>${escapeHtml(dbMeta.alertText)}</strong></span></div>`;
  } else {
    alertHtml = `<div class="alert orange"><span>⚠️</span><span class="alert-text"><strong>${info.alertText}</strong></span></div>`;
  }

  // Build exercise table rows
  let exRows: string;
  if (dbExercises && dbExercises.length > 0) {
    exRows = dbExercises.map(ex => renderExerciseRowFromDb(ex)).join("");
  } else if (info.exercises && info.exercises.length > 0) {
    exRows = info.exercises.map(ex => {
      const weight = getExerciseWeight(ex, weekCode);
      const badge = getExerciseBadge(ex, weekCode);
      return `<tr>
        <td class="td-letter">${ex.letter}</td>
        <td><div class="td-name">${ex.name}</div><div class="td-muscle">${ex.muscle}</div></td>
        <td class="td-sets">${ex.sets}</td>
        <td class="td-reps">${ex.reps}</td>
        <td class="td-weight"><div class="w-badge ${badge.type === "ok" ? "up" : badge.type === "warn" ? "same" : "new"}">${weight}${badge.type === "ok" ? ' <span class="w-arrow">↑</span>' : ''}</div></td>
        <td class="td-status"><span class="status-badge ${badge.type}">${badge.label}</span></td>
        <td style="text-align:right; font-family:var(--mono); font-size:11px; color:var(--text3);">${ex.rest}</td>
      </tr>`;
    }).join("");
  } else {
    exRows = `<tr><td colspan="7" style="padding:20px; text-align:center; color:var(--text3);">Detalles de ejercicios próximamente</td></tr>`;
  }

  return `
  ${alertHtml}
  <div class="section-title">Calentamiento · 8 min</div>
  <div class="warmup-grid">
    ${warmupItems.map(w => `<div class="warmup-item"><div class="wi-icon">${w.icon}</div><div class="wi-text">${w.text}</div></div>`).join("")}
  </div>
  <div class="section-title">Ejercicios</div>
  <table class="ex-table">
    <thead><tr>
      <th style="width:32px"></th><th>Ejercicio</th>
      <th class="c">Series</th><th class="c">Reps</th>
      <th class="r">Carga</th><th class="c">Estado</th><th class="r">Descanso</th>
    </tr></thead>
    <tbody>
    ${exRows}
    </tbody>
  </table>`;
}

function renderExerciseRowFromDb(ex: DbExercise): string {
  const badgeType = ex.badge?.toLowerCase().includes("sube") ? "ok" :
    ex.badge?.toLowerCase().includes("nuevo") ? "new" : "warn";
  const badgeLabel = ex.badge || "";
  const arrow = badgeType === "ok" ? ' <span class="w-arrow">↑</span>' : "";
  const badgeClass = badgeType === "ok" ? "up" : badgeType === "new" ? "new" : "same";

  const loadText = ex.load || "";

  return `<tr>
    <td class="td-letter">${escapeHtml(ex.letter)}</td>
    <td><div class="td-name">${escapeHtml(ex.name)}</div><div class="td-muscle">${escapeHtml(ex.muscle)}</div></td>
    <td class="td-sets">${escapeHtml(ex.sets)}</td>
    <td class="td-reps">${escapeHtml(ex.reps)}</td>
    <td class="td-weight"><div class="w-badge ${badgeClass}">${escapeHtml(loadText)}${arrow}</div></td>
    <td class="td-status"><span class="status-badge ${badgeType}">${escapeHtml(badgeLabel)}</span></td>
    <td style="text-align:right; font-family:var(--mono); font-size:11px; color:var(--text3);">${escapeHtml(ex.rest)}</td>
  </tr>`;
}

function renderCardioPanel(day: DayData, weekCode: string, dbData?: DayDbData): string {
  const isTirada = day.session_name.toLowerCase().includes("tirada");
  const dbMeta = dbData?.meta;

  // Use DB cardio data if available
  const dbCardio = dbMeta?.cardio;

  // Use DB warmups if available, fall back to hardcoded
  const warmupItems = dbMeta?.warmups && dbMeta.warmups.length > 0
    ? dbMeta.warmups
    : warmups.cardio;

  // Determine distance, zone, pace from DB or parse from note
  let distance = dbCardio?.distance || (isTirada ? "10 km" : "8 km");
  let zone = dbCardio?.zone || "Z2";
  let pace = dbCardio?.pace || "~7:00-7:30/km";
  let detailNote = dbCardio?.zoneNote || day.note || "";

  // Alert: DB meta first
  let alertHtml = "";
  if (dbMeta?.alertType && dbMeta?.alertText) {
    const alertType = dbMeta.alertType;
    alertHtml = `<div class="alert ${escapeHtml(alertType)}"><span>🏃</span><span class="alert-text"><strong>${escapeHtml(dbMeta.alertText)}</strong></span></div>`;
  } else if (dbMeta?.alertText) {
    alertHtml = `<div class="alert blue"><span>🏃</span><span class="alert-text"><strong>${escapeHtml(dbMeta.alertText)}</strong></span></div>`;
  }
  if (detailNote.includes("<145")) zone = "Z2 · FC <145";
  if (detailNote.includes("8:00")) pace = "~7:30-8:00/km";

  return `
  <div class="alert ${isTirada ? "orange" : "green"}"><span>${isTirada ? "🏃" : "✅"}</span>
    <span class="alert-text"><strong>${isTirada ? "Tirada larga" : "Carrera aeróbica"}.</strong> ${detailNote || (isTirada ? "Mantén ritmo conversacional toda la sesión." : "Zona 2 toda la carrera. Si subes a Z3, baja el ritmo.")}</span>
  </div>
  <div class="section-title">Calentamiento · 8 min</div>
  <div class="warmup-grid">
    ${warmupItems.map(w => `<div class="warmup-item"><div class="wi-icon">${w.icon}</div><div class="wi-text">${w.text}</div></div>`).join("")}
  </div>
  <div class="cardio-block">
    <div class="cb-item"><div class="cb-label">Distancia</div><div class="cb-value">${distance}</div><div class="cb-note">Objetivo de la sesión</div></div>
    <div class="cb-item"><div class="cb-label">Zona FC</div><div class="cb-value green">${zone}</div><div class="cb-note">No sobrepasar 140 ppm (Z2 puro)</div></div>
    <div class="cb-item"><div class="cb-label">Pace</div><div class="cb-value gold">${pace}</div><div class="cb-note">Conversacional — puedes hablar</div></div>
    <div class="cb-item"><div class="cb-label">Hidratación</div><div class="cb-value" style="color:var(--blue);">500 ml</div><div class="cb-note">Antes de salir + sorbos cada 20 min</div></div>
  </div>`;
}

// Escapa solo caracteres HTML peligrosos, preserva entidades existentes (&amp; etc)
function escapeHtml(str: string): string {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
