export type AppSectionId =
  | "licitaciones"
  | "tareas"
  | "salud"
  | "proyectos"
  | "muebles"
  | "banco"
  | "contador";

export type AppSection = {
  id: AppSectionId;
  label: string;
  href: `/${AppSectionId}`;
  description: string;
  summary: string;
  status: "base lista" | "para modelar";
  contextFile: `src/modules/${string}/CONTEXT.md`;
  nextSlice: string[];
  dataModel: string[];
  boundaries: string[];
  checklist: string[];
};

export const APP_SECTIONS: AppSection[] = [
  {
    id: "licitaciones",
    label: "Licitaciones",
    href: "/licitaciones",
    description: "Seguimiento de oportunidades, estados y proximos movimientos.",
    summary:
      "Flujo comercial de licitaciones: listado, filtros, decisiones y recordatorios sin mezclarlo con otros dominios.",
    status: "para modelar",
    contextFile: "src/modules/licitaciones/CONTEXT.md",
    nextSlice: [
      "Listado principal con filtros por estado y fecha de cierre.",
      "Accion del usuario: revisar, postular, descartar o ganado.",
      "Notas rapidas por oportunidad.",
    ],
    dataModel: ["licitaciones", "licitacion_notas", "licitacion_eventos"],
    boundaries: [
      "No mezclar documentos tributarios aqui.",
      "No meter tareas genericas si no dependen de una licitacion.",
      "Los scrapers o importadores van fuera del UI principal.",
    ],
    checklist: [
      "Modelo claro de estado.",
      "Fechas criticas visibles.",
      "Acciones rapidas sin abrir modales pesados.",
    ],
  },
  {
    id: "tareas",
    label: "Tareas",
    href: "/tareas",
    description: "Gestion operativa de pendientes por area, foco y prioridad.",
    summary:
      "Capturar, ordenar y cerrar tareas. Si una tarea pertenece a otra seccion, la referencia vive aqui y el detalle queda en su modulo dueno.",
    status: "para modelar",
    contextFile: "src/modules/tareas/CONTEXT.md",
    nextSlice: [
      "Backlog simple por prioridad.",
      "Vista de hoy y esta semana.",
      "Vinculacion opcional a proyecto o licitacion.",
    ],
    dataModel: ["tasks", "task_labels", "task_links"],
    boundaries: [
      "No duplicar proyectos completos.",
      "No guardar notas largas tipo bitacora.",
      "Evitar automatizaciones antes de estabilizar el flujo manual.",
    ],
    checklist: [
      "Crear tarea en un paso.",
      "Cambiar estado sin friccion.",
      "Filtros por prioridad, area y fecha.",
    ],
  },
  {
    id: "salud",
    label: "Salud",
    href: "/salud",
    description: "Metricas fisicas, rutina y seguimiento de habitos clave.",
    summary:
      "Seguimiento de datos fisicos, progreso temporal y registros manuales sin cargar el resto del dashboard con logica innecesaria.",
    status: "para modelar",
    contextFile: "src/modules/salud/CONTEXT.md",
    nextSlice: [
      "Registro de metricas por fecha.",
      "Resumen semanal con tendencia.",
      "Rutina base sin OCR ni importadores todavia.",
    ],
    dataModel: ["health_metrics", "workout_sessions", "habit_logs"],
    boundaries: [
      "No volver a meter parsers OCR en el frontend.",
      "Los scripts de importacion viven fuera de la app principal.",
      "No mostrar demasiados graficos antes de tener datos limpios.",
    ],
    checklist: [
      "Metricas minimas utiles.",
      "Vista historica comprensible.",
      "Separacion entre registros manuales e importados.",
    ],
  },
  {
    id: "proyectos",
    label: "Proyectos",
    href: "/proyectos",
    description: "Seguimiento de proyectos, hitos, riesgos y proximos pasos.",
    summary:
      "Espacio para roadmap y avance. Agrupa iniciativas y puede enlazar otras areas sin absorberlas.",
    status: "para modelar",
    contextFile: "src/modules/proyectos/CONTEXT.md",
    nextSlice: [
      "Listado de proyectos activos.",
      "Hitos y estado general.",
      "Relacion con tareas y notas cortas.",
    ],
    dataModel: ["projects", "project_milestones", "project_updates"],
    boundaries: [
      "No usar esta seccion como archivo general de ideas.",
      "No duplicar estados de tareas uno a uno.",
      "La documentacion extensa sigue fuera de la UI.",
    ],
    checklist: [
      "Estado visible por proyecto.",
      "Proximo paso claro.",
      "Fechas y responsables cuando hagan falta.",
    ],
  },
  {
    id: "muebles",
    label: "Muebles",
    href: "/muebles",
    description: "Disenos, compras, materiales y seguimiento de fabricacion.",
    summary:
      "Modelos, materiales, costos y decisiones de compra tratados como un dominio concreto.",
    status: "para modelar",
    contextFile: "src/modules/muebles/CONTEXT.md",
    nextSlice: [
      "Catalogo de ideas o modelos.",
      "Materiales y costos base.",
      "Checklist simple de compra y fabricacion.",
    ],
    dataModel: [
      "furniture_projects",
      "furniture_materials",
      "furniture_purchases",
    ],
    boundaries: [
      "No meter archivos pesados de referencia dentro del repo UI.",
      "Los calculos grandes o comparativas pueden ir a scripts separados.",
      "Evitar copiar tablas eternas del proyecto viejo.",
    ],
    checklist: [
      "Modelo o pieza.",
      "Material estimado.",
      "Costo y estado de avance.",
    ],
  },
  {
    id: "banco",
    label: "Banco",
    href: "/banco",
    description: "Cuentas, movimientos y una vista clara del flujo financiero.",
    summary:
      "Consolidacion financiera y movimientos, sin mezclar esta seccion con contador o tareas salvo por referencias puntuales.",
    status: "para modelar",
    contextFile: "src/modules/banco/CONTEXT.md",
    nextSlice: [
      "Resumen de cuentas.",
      "Movimientos recientes.",
      "Filtro por periodo y categoria.",
    ],
    dataModel: ["bank_accounts", "bank_transactions", "bank_categories"],
    boundaries: [
      "No guardar documentos tributarios aqui.",
      "No convertirlo en planilla infinita.",
      "La conciliacion avanzada puede esperar a una segunda etapa.",
    ],
    checklist: [
      "Saldo por cuenta.",
      "Ingresos y egresos claros.",
      "Clasificacion minima consistente.",
    ],
  },
  {
    id: "contador",
    label: "Contador",
    href: "/contador",
    description: "Documentos, vencimientos y coordinacion contable.",
    summary:
      "Centraliza lo tributario y administrativo para no contaminar otras vistas con reglas y frecuencias distintas.",
    status: "para modelar",
    contextFile: "src/modules/contador/CONTEXT.md",
    nextSlice: [
      "Documentos pendientes.",
      "Vencimientos relevantes.",
      "Checklist de cierre mensual.",
    ],
    dataModel: ["tax_documents", "tax_deadlines", "accounting_notes"],
    boundaries: [
      "No usarlo como chat o agente gigante desde el dia uno.",
      "No mezclar movimientos bancarios detallados aqui.",
      "La automatizacion documental puede venir despues.",
    ],
    checklist: [
      "Que hay que entregar.",
      "Para cuando.",
      "Que falta resolver.",
    ],
  },
];

export function getSectionById(id: AppSectionId) {
  const section = APP_SECTIONS.find((item) => item.id === id);
  if (!section) {
    throw new Error(`Unknown section: ${id}`);
  }

  return section;
}
